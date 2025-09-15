// src/controllers/userDetails.controller.ts
import type { Request, Response, NextFunction } from 'express';
import * as svc from '../services/userDetails.service.js';

type CreateInput = Parameters<typeof svc.createForUser>[1];
type PatchInput = Parameters<typeof svc.patchForUser>[1];

function isHttpError(e: unknown): e is { status?: number; message?: string } {
    return typeof e === 'object' && e !== null && ('status' in e || 'message' in e);
}

export async function getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.params.id);
        const details = await svc.getForUser(userId);
        if (!details) return res.status(404).json({ message: 'Details not found' });
        res.json(details);
    } catch (err: unknown) {
        next(err);
    }
}

export async function createUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.params.id);
        const body = req.body as CreateInput;
        const details = await svc.createForUser(userId, body);
        res.status(201).json(details);
    } catch (err: unknown) {
        if (isHttpError(err) && typeof err.status === 'number') {
            return res.status(err.status).json({ message: String(err.message ?? 'Error') });
        }
        next(err);
    }
}

export async function patchUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.params.id);
        const body = req.body as PatchInput;
        const details = await svc.patchForUser(userId, body);
        res.json(details);
    } catch (err: unknown) {
        if (isHttpError(err) && typeof err.status === 'number') {
            return res.status(err.status).json({ message: String(err.message ?? 'Error') });
        }
        next(err);
    }
}

export async function deleteUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.params.id);
        await svc.deleteForUser(userId);
        res.status(204).end();
    } catch (err: unknown) {
        if (isHttpError(err) && typeof err.status === 'number') {
            return res.status(err.status).json({ message: String(err.message ?? 'Error') });
        }
        next(err);
    }
}
