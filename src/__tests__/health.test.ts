import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

/** Block /api/auth so app never imports auth.controller → config/jwt → jose */
jest.mock('../routes/auth.routes.js', () => {
    return { __esModule: true, default: express.Router() };
});
jest.mock('../routes/auth.routes', () => {
    return { __esModule: true, default: express.Router() };
});

/** Bypass auth middleware just in case */
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

/** Infra used by health */
jest.mock('../config/dynamo.js', () => ({
    ddb: { send: jest.fn().mockResolvedValue({}) },
    DDB_USERS_TABLE: 'users',
}));
jest.mock('../config/prisma.js', () => ({
    prisma: { $queryRawUnsafe: jest.fn().mockResolvedValue([{ '1': 1 }]) },
}));
jest.mock('../config/redis.js', () => ({
    rPing: jest.fn().mockResolvedValue(true),
}));

/** Import app AFTER mocks */
import app from '../app.js';

describe('Health endpoints', () => {
    it('GET /health returns ok/env', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('ok', true);
        expect(res.body).toHaveProperty('env');
    });
});
