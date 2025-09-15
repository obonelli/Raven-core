import type { User } from '../models/user.model.js';
import * as service from '../services/user.service.js';

// Mock the Dynamo repo and cache helpers used by the service
jest.mock('../repositories/user.dynamo.repo.js', () => ({
    list: jest.fn().mockResolvedValue([{ userId: 'u1', name: 'Mary', email: 'mary@example.com' }]),
    getById: jest.fn().mockResolvedValue({ userId: 'u1', name: 'Mary', email: 'mary@example.com' }),
    findByEmail: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ userId: 'u2', name: 'New', email: 'new@example.com' }),
    update: jest.fn().mockResolvedValue({ userId: 'u1', name: 'Mary Updated', email: 'mary@example.com' }),
    remove: jest.fn().mockResolvedValue(undefined)
}));

const getJSON = jest.fn();
const setJSON = jest.fn();
const delKey = jest.fn();

jest.mock('../lib/cache.js', () => ({
    getJSON: (...args: unknown[]) => getJSON(...args),
    setJSON: (...args: unknown[]) => setJSON(...args),
    delKey: (...args: unknown[]) => delKey(...args)
}));

jest.mock('../config/redis.js', () => ({
    buildCacheKey: (...parts: string[]) => parts.join(':')
}));

describe('user.service cache behavior', () => {
    beforeEach(() => {
        getJSON.mockReset();
        setJSON.mockReset();
        delKey.mockReset();
    });

    it('listUsers caches fresh result when cache is empty', async () => {
        // No cached value
        getJSON.mockResolvedValueOnce(null);

        const result = await service.listUsers(100);

        expect(result).toHaveLength(1);
        expect(setJSON).toHaveBeenCalledTimes(1);
        expect(setJSON.mock.calls[0][0]).toBe('users:limit:100');
    });

    it('listUsers returns cached when available and does not call setJSON', async () => {
        // First call seeds the cache
        getJSON.mockResolvedValueOnce(null);
        await service.listUsers(100);

        // Second call hits cache
        getJSON.mockResolvedValueOnce([{ userId: 'cached', name: 'C', email: 'c@e.com' } as User]);
        const result2 = (await service.listUsers(100)) as User[];

        expect(result2).toHaveLength(1);
        expect(result2[0]!.userId).toBe('cached'); // non-null assertion
        // setJSON should have been called only once (from the first call)
        expect(setJSON).toHaveBeenCalledTimes(1);
    });

    it('getUser returns cached when present', async () => {
        getJSON.mockResolvedValueOnce({ userId: 'u1', name: 'Cached', email: 'c@e.com' } as User);
        const res = await service.getUser('u1');
        expect(res?.name).toBe('Cached');
        // No new cache write
        expect(setJSON).not.toHaveBeenCalled();
    });
});
