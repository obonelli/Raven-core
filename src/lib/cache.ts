// src/lib/cache.ts
import { redis, REDIS_TTL } from '../config/redis.js';

export async function getJSON<T>(key: string): Promise<T | null> {
    const raw = await redis.get<string>(key);
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : (raw as any)) : null;
}

export async function setJSON<T>(key: string, value: T, ttlSeconds = REDIS_TTL): Promise<void> {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

export async function delKey(key: string): Promise<void> {
    await redis.del(key);
}
