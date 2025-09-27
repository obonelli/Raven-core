// src/middlewares/requireAuth.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../config/jwt.js';
import type { AuthUser } from '../types/auth.js';

type Decoded = {
    sub: string | number;
    email?: string;
    role?: string;
    typ?: 'access' | 'refresh';
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const raw = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
        if (!raw) return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });

        const m = /^Bearer\s+(.+)$/i.exec(raw.trim());
        const token = m ? m[1] : undefined;
        if (!token) return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });

        const payload = await verifyJWT<Decoded>(token);

        // acepta tokens sin typ; rechaza si viene distinto de 'access'
        if (payload.typ && payload.typ !== 'access') {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token type' });
        }
        if (payload.sub === undefined || payload.sub === null) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Missing sub' });
        }

        const sub = typeof payload.sub === 'string' ? payload.sub : String(payload.sub);

        // Para controladores nuevos (req.user / req.token)
        const user: AuthUser = {
            sub,
            ...(payload.email !== undefined ? { email: payload.email } : {}),
            ...(payload.role !== undefined ? { role: payload.role } : {}),
        };
        req.user = user;
        req.token = token;

        // Compatibilidad con controladores viejos (req.auth / req.userId)
        const r = req as Request & { auth?: Decoded; userId?: string };
        r.auth = payload;
        r.userId = sub;

        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
}
