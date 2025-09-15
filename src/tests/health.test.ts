import request from 'supertest';
import app from '../app.js';

describe('health', () => {
    it('ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });
});
