// src/middlewares/error-handler.ts
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

type HttpishError = { status?: number; statusCode?: number; message?: string };

function pickStatus(e: unknown): number {
    if (typeof e === 'object' && e !== null) {
        const s = (e as HttpishError).status ?? (e as HttpishError).statusCode;
        if (typeof s === 'number') return s;
    }
    return 500;
}

function pickMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    if (typeof e === 'object' && e !== null && typeof (e as HttpishError).message === 'string') {
        return (e as HttpishError).message as string;
    }
    return 'Internal Server Error';
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    const status = pickStatus(err);
    if (status >= 500) logger.error({ err }, 'Unhandled error');
    res.status(status).json({ error: pickMessage(err) });
}
