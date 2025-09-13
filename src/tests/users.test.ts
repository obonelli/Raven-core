import request from 'supertest';
import app from '../app';

describe('users', () => {
    it('create and fetch', async () => {
        const create = await request(app).post('/api/users').send({ email: 'a@b.com', name: 'Mary' });
        expect(create.status).toBe(201);
        const id = create.body.id;

        const list = await request(app).get('/api/users');
        expect(list.body.some((u: any) => u.id === id)).toBe(true);
    });
});
