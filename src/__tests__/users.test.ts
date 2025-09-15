// @ts-nocheck
import request from 'supertest';

/** Block /api/auth so app never imports auth.controller → config/jwt → jose */
jest.mock('../routes/auth.routes.js', () => {
    const express = require('express');
    return { __esModule: true, default: express.Router() };
});
jest.mock('../routes/auth.routes', () => {
    const express = require('express');
    return { __esModule: true, default: express.Router() };
});

/** Bypass auth middleware (for protected routes if touched) */
jest.mock('../middlewares/requireAuth.js', () => ({
    __esModule: true,
    default: (_req: any, _res: any, next: any) => next(),
    requireAuth: (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../middlewares/requireAuth', () => ({
    __esModule: true,
    default: (_req: any, _res: any, next: any) => next(),
    requireAuth: (_req: any, _res: any, next: any) => next(),
}));

/** Repos + cache used by /api/users */
jest.mock('../repositories/user.dynamo.repo.js', () => ({
    list: jest.fn().mockResolvedValue([
        { userId: 'u1', name: 'Mary', email: 'mary@example.com' },
    ]),
    getById: jest.fn().mockResolvedValue({
        userId: 'u1',
        name: 'Mary',
        email: 'mary@example.com',
    }),
    findByEmail: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({
        userId: 'u2',
        name: 'New',
        email: 'new@example.com',
    }),
    update: jest.fn().mockResolvedValue({
        userId: 'u1',
        name: 'Mary Updated',
        email: 'mary@example.com',
    }),
    remove: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../config/redis.js', () => ({
    buildCacheKey: (...parts: string[]) => parts.join(':'), // used by your service/cache
    rPing: jest.fn().mockResolvedValue(true),
}));
jest.mock('../lib/cache.js', () => ({
    getJSON: jest.fn().mockResolvedValue(null),
    setJSON: jest.fn().mockResolvedValue(undefined),
    delKey: jest.fn().mockResolvedValue(undefined),
}));

/** Import app AFTER mocks */
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
