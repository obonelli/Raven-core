// src/controllers/auth.controller.ts
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { buildCacheKey, rSet, rGet, rDel, REDIS_TTL } from '../config/redis.js';
import { signAccessToken, signRefreshToken, verifyJWT, REFRESH_EXPIRES_IN } from '../config/jwt.js';
import * as usersRepo from '../repositories/user.dynamo.repo.js';

// Parse "7d" → seconds (s/m/h/d/w)
function toSeconds(span: string): number {
    const m = /^(\d+)([smhdw])$/.exec(span);
    if (!m) return 60 * 60 * 24 * 7;
    const n = Number(m[1]);
    const u = m[2];
    switch (u) {
        case 's': return n;
        case 'm': return n * 60;
        case 'h': return n * 3600;
        case 'd': return n * 86400;
        case 'w': return n * 604800;
        default: return 60 * 60 * 24 * 7;
    }
}

const REFRESH_TTL_SEC = toSeconds(REFRESH_EXPIRES_IN);
const refreshTokenKey = (userId: string, jti: string) => buildCacheKey('rt', userId, jti);

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body as { email: string; password: string };

        // 1) Query by email (GSI)
        const matches = await usersRepo.findByEmail(email);
        let user = matches[0] ?? null;

        // 2) If GSI projection didn't include passwordHash, hydrate with PK get
        if (user && !(user as any).passwordHash) {
            const full = await usersRepo.getById(user.userId);
            user = full ?? user;
        }

        if (!user || !(user as any).passwordHash) {
            return res.status(401).json({ error: 'InvalidCredentials', message: 'Email or password is incorrect' });
        }

        const ok = await bcrypt.compare(password, (user as any).passwordHash as string);
        if (!ok) {
            return res.status(401).json({ error: 'InvalidCredentials', message: 'Email or password is incorrect' });
        }

        const base = {
            sub: String(user.userId),
            ...(user.email !== undefined ? { email: user.email } : {}),
            ...((user as any).role !== undefined ? { role: (user as any).role as string } : {}),
        };
        const jti = crypto.randomUUID();

        const accessToken = await signAccessToken(base);
        const refreshToken = await signRefreshToken({ ...base, jti });

        await rSet(refreshTokenKey(String(user.userId), jti), true, Math.max(REFRESH_TTL_SEC, REDIS_TTL));

        return res.json({
            user: { id: user.userId, email: user.email, role: (user as any).role ?? undefined },
            accessToken,
            refreshToken,
        });
    } catch (e) {
        next(e);
    }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response, _next: NextFunction) {
    try {
        const { refreshToken } = req.body as { refreshToken: string };
        const payload = await verifyJWT<{ sub?: string; jti?: string; email?: string; role?: string; typ?: 'refresh' }>(refreshToken);

        if (payload.typ !== 'refresh' || !payload.sub || !payload.jti) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });
        }

        const exists = await rGet<boolean>(refreshTokenKey(String(payload.sub), String(payload.jti)));
        if (!exists) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Refresh token is not active' });
        }

        // rotate
        await rDel(refreshTokenKey(String(payload.sub), String(payload.jti)));

        const base = {
            sub: String(payload.sub),
            ...(payload.email !== undefined ? { email: payload.email } : {}),
            ...(payload.role !== undefined ? { role: payload.role } : {}),
        };
        const newJti = crypto.randomUUID();

        const accessToken = await signAccessToken(base);
        const newRefreshToken = await signRefreshToken({ ...base, jti: newJti });

        await rSet(refreshTokenKey(String(payload.sub), newJti), true, Math.max(REFRESH_TTL_SEC, REDIS_TTL));

        return res.json({ accessToken, refreshToken: newRefreshToken });
    } catch {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
    }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
        if (!refreshToken) return res.json({ ok: true });

        try {
            const payload = await verifyJWT<{ sub?: string; jti?: string; typ?: 'refresh' }>(refreshToken);
            if (payload.typ === 'refresh' && payload.sub && payload.jti) {
                await rDel(refreshTokenKey(String(payload.sub), String(payload.jti)));
            }
        } catch {
            // ignore malformed token
        }
        return res.json({ ok: true });
    } catch (e) {
        next(e);
    }
}

// GET /api/auth/me
export async function me(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    return res.json({ user: req.user });
}
