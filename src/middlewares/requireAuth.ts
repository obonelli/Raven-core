// src/middlewares/requireAuth.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../config/jwt.js';
import type { AuthUser } from '../types/auth.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const h = req.headers.authorization ?? '';
        const token = h.startsWith('Bearer ') ? h.slice(7) : undefined;
        if (!token) {
            return res
                .status(401)
                .json({ error: 'Unauthorized', message: 'Missing Bearer token' });
        }

        const payload = await verifyJWT<{
            sub: string;
            email?: string;
            role?: string;
            typ?: 'access' | 'refresh';
        }>(token);

        if (payload.typ !== 'access') {
            return res
                .status(401)
                .json({ error: 'Unauthorized', message: 'Invalid token type' });
        }

        const user: AuthUser = {
            sub: String(payload.sub),
            ...(payload.email !== undefined ? { email: payload.email } : {}),
            ...(payload.role !== undefined ? { role: payload.role } : {}),
        };

        // req.user y req.token vienen de la augmentación global en src/types/express.d.ts
        req.user = user;
        req.token = token;

        next();
    } catch {
        return res
            .status(401)
            .json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
}
