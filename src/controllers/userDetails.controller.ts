// src/controllers/userDetails.controller.ts
import type { Request, Response, NextFunction } from 'express';
import * as svc from '../services/userDetails.service.js';

export async function getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.params.id);
        const details = await svc.getForUser(userId);
        if (!details) return res.status(404).json({ message: 'Details not found' });
        res.json(details);
    } catch (err) { next(err); }
}

export async function createUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.params.id);
        const details = await svc.createForUser(userId, req.body);
        res.status(201).json(details);
    } catch (err: any) {
        if (err?.status) return res.status(err.status).json({ message: err.message });
        next(err);
    }
}

export async function patchUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.params.id);
        const details = await svc.patchForUser(userId, req.body);
        res.json(details);
    } catch (err: any) {
        if (err?.status) return res.status(err.status).json({ message: err.message });
        next(err);
    }
}

export async function deleteUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.params.id);
        await svc.deleteForUser(userId);
        res.status(204).end();
    } catch (err: any) {
        if (err?.status) return res.status(err.status).json({ message: err.message });
        next(err);
    }
}
