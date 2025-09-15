import request from 'supertest';
import app from '../app.js';

// 🔒 Mock JWT to avoid loading `jose` ESM
jest.mock('../config/jwt.js', () => ({
    signAccessToken: jest.fn().mockResolvedValue('tok'),
    signRefreshToken: jest.fn().mockResolvedValue('rtok'),
    verifyJWT: jest.fn().mockResolvedValue({ sub: 'u1', email: 'x@y.z' }),
    REFRESH_EXPIRES_IN: '7d'
}));

// 🧰 Mocks infra used in health routes
jest.mock('../config/dynamo.js', () => {
    return {
        ddb: { send: jest.fn().mockResolvedValue({}) },
        DDB_USERS_TABLE: 'users'
    };
});

jest.mock('../config/prisma.js', () => {
    return {
        prisma: {
            $queryRawUnsafe: jest.fn().mockResolvedValue([{ '1': 1 }])
        }
    };
});

jest.mock('../config/redis.js', () => {
    return {
        rPing: jest.fn().mockResolvedValue(true)
    };
});

describe('Health routes', () => {
    it('GET /api/health/dynamo returns ok', async () => {
        const res = await request(app).get('/api/health/dynamo');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true, service: 'dynamo' });
    });

    it('GET /api/health/mysql returns ok', async () => {
        const res = await request(app).get('/api/health/mysql');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true, service: 'mysql' });
    });

    it('GET /api/health/redis returns ok', async () => {
        const res = await request(app).get('/api/health/redis');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true, service: 'redis' });
    });
});
