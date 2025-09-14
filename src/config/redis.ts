// src/config/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const REDIS_NS = process.env.REDIS_NAMESPACE ?? 'myapi';
export const REDIS_TTL = Number(process.env.REDIS_TTL_SECONDS ?? 300);
export const k = (...parts: string[]) => [REDIS_NS, ...parts].join(':');
