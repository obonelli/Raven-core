// src/controllers/verify.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { startPhoneVerification, confirmPhoneVerification } from '../services/otp.service.js';

interface HttpError {
    status?: number;
    message?: string;
    code?: string;
}

function isHttpError(e: unknown): e is HttpError {
    if (typeof e !== 'object' || e === null) return false;
    const obj = e as Record<string, unknown>;
    const statusOk =
        obj.status === undefined || (typeof obj.status === 'number' && Number.isFinite(obj.status));
    const messageOk = obj.message === undefined || typeof obj.message === 'string';
    const codeOk = obj.code === undefined || typeof obj.code === 'string';
    return statusOk && messageOk && codeOk;
}

type ReqWithAuth = Request & {
    auth?: { sub?: string | number };
    userId?: string | number;
};

function getUserId(req: Request): string {
    const r = req as ReqWithAuth;
    const raw = r.auth?.sub ?? r.userId;
    return typeof raw === 'string' ? raw : typeof raw === 'number' ? String(raw) : '';
}

export async function start(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { phone } = req.body as { phone: string };
        await startPhoneVerification({ userId, phone });
        res.status(204).end();
    } catch (err: unknown) {
        if (isHttpError(err) && typeof err.status === 'number') {
            const message = typeof err.message === 'string' ? err.message : 'Error';
            return res.status(err.status).json({ message, code: err.code });
        }
        next(err);
    }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { phone, code } = req.body as { phone: string; code: string };
        await confirmPhoneVerification({ userId, phone, code });
        res.status(204).end();
    } catch (err: unknown) {
        if (isHttpError(err) && typeof err.status === 'number') {
            const message = typeof err.message === 'string' ? err.message : 'Error';
            return res.status(err.status).json({ message, code: err.code });
        }
        next(err);
    }
}
