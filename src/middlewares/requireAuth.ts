import type { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../config/jwt.js';

export type AuthUser = {
    sub: string;
    email?: string; // may be omitted, but if present must be string
    role?: string;  // same
};

declare module 'express-serve-static-core' {
    interface Request {
        user?: AuthUser;
        token?: string;
    }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const h = req.headers.authorization ?? '';
        const token = h.startsWith('Bearer ') ? h.slice(7) : undefined;
        if (!token) return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });

        const payload = await verifyJWT<{
            sub: string;
            email?: string;
            role?: string;
            typ?: 'access' | 'refresh';
        }>(token);

        if (payload.typ !== 'access') {
            return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token type' });
        }

        // Omit undefined props to satisfy exactOptionalPropertyTypes
        const user: AuthUser = {
            sub: String(payload.sub),
            ...(payload.email !== undefined ? { email: payload.email } : {}),
            ...(payload.role !== undefined ? { role: payload.role } : {}),
        };

        req.user = user;
        req.token = token;
        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
}
