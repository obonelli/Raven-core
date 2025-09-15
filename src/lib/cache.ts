// src/lib/cache.ts
import { redis, REDIS_TTL } from '../config/redis.js';

export async function getJSON<T>(key: string): Promise<T | null> {
    const raw = await redis.get<unknown>(key);
    if (raw == null) return null;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw) as T;
        } catch {
            return raw as unknown as T;
        }
    }
    return raw as T;
}

export async function setJSON<T>(key: string, value: T, ttlSeconds = REDIS_TTL): Promise<void> {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

export async function delKey(key: string): Promise<void> {
    await redis.del(key);
}
