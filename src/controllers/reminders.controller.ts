// src/controllers/reminders.controller.ts
import type { Request, Response, NextFunction } from 'express';
import * as parseSvc from '../services/parse.service.js';
import * as svc from '../services/reminder.service.js';

type CreateInput = Parameters<typeof svc.createReminderAndEnqueue>[0];
type ListQuery = Parameters<typeof svc.listUserReminders>[1];

function isHttpError(e: unknown): e is { status?: number; message?: string } {
    return typeof e === 'object' && e !== null && ('status' in e || 'message' in e);
}

export async function parseReminder(req: Request, res: Response, next: NextFunction) {
    try {
        const out = await parseSvc.parseReminder({ text: String(req.body.text ?? ''), tz: req.body.tz });
        res.json(out);
    } catch (err) { next(err); }
}

export async function createReminder(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body as CreateInput;
        const r = await svc.createReminderAndEnqueue(body);
        res.status(201).json(r);
    } catch (err) {
        if (isHttpError(err) && typeof err.status === 'number') {
            return res.status(err.status).json({ message: String(err.message ?? 'Error') });
        }
        next(err);
    }
}

export async function listReminders(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = String(req.query.userId);
        const q: ListQuery = {};
        if (typeof req.query.from === 'string') q.from = req.query.from;
        if (typeof req.query.to === 'string') q.to = req.query.to;
        if (typeof req.query.status === 'string') q.status = req.query.status;
        const list = await svc.listUserReminders(userId, q);
        res.json(list);
    } catch (err) { next(err); }
}

export async function snoozeReminder(req: Request, res: Response, next: NextFunction) {
    try {
        const minutes = Number(req.body?.minutes ?? 30);
        const out = await svc.snoozeReminder(String(req.params.id), minutes);
        res.json(out);
    } catch (err) {
        if (isHttpError(err) && typeof err.status === 'number') {
            return res.status(err.status).json({ message: String(err.message ?? 'Error') });
        }
        next(err);
    }
}

export async function completeReminder(req: Request, res: Response, next: NextFunction) {
    try {
        const out = await svc.completeReminder(String(req.params.id));
        res.json(out);
    } catch (err) {
        if (isHttpError(err) && typeof err.status === 'number') {
            return res.status(err.status).json({ message: String(err.message ?? 'Error') });
        }
        next(err);
    }
}
