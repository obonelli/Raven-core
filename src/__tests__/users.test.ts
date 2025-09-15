import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

jest.mock('../routes/auth.routes.js', () => ({ __esModule: true, default: express.Router() }));
jest.mock('../routes/auth.routes', () => ({ __esModule: true, default: express.Router() }));

jest.mock('../middlewares/requireAuth.js', () => ({
    __esModule: true,
    default: (_req: Request, _res: Response, next: NextFunction) => next(),
    requireAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}));
jest.mock('../middlewares/requireAuth', () => ({
    __esModule: true,
    default: (_req: Request, _res: Response, next: NextFunction) => next(),
    requireAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../repositories/user.dynamo.repo.js', () => ({
    list: jest.fn().mockResolvedValue([{ userId: 'u1', name: 'Mary', email: 'mary@example.com' }]),
    getById: jest.fn().mockResolvedValue({ userId: 'u1', name: 'Mary', email: 'mary@example.com' }),
    findByEmail: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ userId: 'u2', name: 'New', email: 'new@example.com' }),
    update: jest.fn().mockResolvedValue({ userId: 'u1', name: 'Mary Updated', email: 'mary@example.com' }),
    remove: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../config/redis.js', () => ({
    k: (...parts: string[]) => parts.join(':'),
    buildCacheKey: (...parts: string[]) => parts.join(':'), // por si el código usa este nombre
    rPing: jest.fn().mockResolvedValue(true),
    rGet: jest.fn(),
    rSet: jest.fn(),
    rDel: jest.fn(),
}));

jest.mock('../lib/cache.js', () => ({
    getJSON: jest.fn().mockResolvedValue(null),
    setJSON: jest.fn().mockResolvedValue(undefined),
    delKey: jest.fn().mockResolvedValue(undefined),
}));

import app from '../app.js';

describe('Users smoke tests', () => {
    it('GET /api/ping works', async () => {
        const res = await request(app).get('/api/ping');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true, message: 'pong 🏓' });
    });

    it('GET /api/users returns list', async () => {
        const res = await request(app).get('/api/users').expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('userId', 'u1');
    });
});
