// src/config/redis.ts
import 'dotenv/config';
import { Redis } from '@upstash/redis';
import type { ConnectionOptions } from 'bullmq';
import type { RedisOptions } from 'ioredis';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isTest = NODE_ENV === 'test';
const isDev = NODE_ENV === 'development';

const clean = (v?: string) =>
    v?.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');

// === Upstash REST (para cache / kv) ===
const REST_URL = clean(process.env.UPSTASH_REDIS_REST_URL);
const REST_TOKEN = clean(process.env.UPSTASH_REDIS_REST_TOKEN);

export const REDIS_NAMESPACE = (process.env.REDIS_NAMESPACE ?? 'myapi').trim();
export const REDIS_TTL = Number(process.env.REDIS_TTL_SECONDS ?? 300);

/**
 * En test, no exigimos credenciales reales porque se moquea @upstash/redis.
 * En dev/prod sí validamos.
 */
if (!isTest) {
    if (!REST_URL || !REST_TOKEN) {
        throw new Error('Missing Redis envs: UPSTASH_REDIS_REST_URL / _TOKEN');
    }
}

export const redis = new Redis({
    url: REST_URL ?? 'https://example.test', // dummy en test (mock lo intercepta)
    token: REST_TOKEN ?? 'test-token',
    automaticDeserialization: true,
});

// === BullMQ (wire protocol) ===
const WIRE_URL =
    clean(process.env.BULL_REDIS_URL) ??
    clean(process.env.UPSTASH_REDIS_URL) ??
    clean(process.env.UPSTASH_REDIS_TLS_URL) ??
    undefined;

function urlToConnectionOptions(url: string): ConnectionOptions {
    const u = new URL(url);
    const isTls = u.protocol === 'rediss:';

    const opts: RedisOptions = {
        host: u.hostname,
        port: u.port ? Number(u.port) : 6379,
    };

    if (u.username) (opts as { username?: string }).username = decodeURIComponent(u.username);
    if (u.password) (opts as { password?: string }).password = decodeURIComponent(u.password);
    if (isTls) (opts as { tls?: unknown }).tls = {};

    return opts as unknown as ConnectionOptions;
}

/**
 * Exporta la conexión para BullMQ. Siempre tipada.
 * - En test: conexión dummy inofensiva (con bullmq mockeado no se usa).
 * - En dev/prod: se construye a partir de WIRE_URL.
 */
export const bullConnection: ConnectionOptions = (() => {
    if (isTest || process.env.BULL_DISABLED === 'true') {
        return { host: '127.0.0.1', port: 0 } as ConnectionOptions;
    }

    if (!WIRE_URL) {
        throw new Error(
            [
                'BullMQ requires a Redis wire-protocol URL.',
                'Provide BULL_REDIS_URL (e.g., rediss://:password@host:port)',
                'or UPSTASH_REDIS_URL / UPSTASH_REDIS_TLS_URL.',
                'Note: UPSTASH_REDIS_REST_URL/TOKEN are REST-only and NOT compatible with BullMQ.',
            ].join(' ')
        );
    }
    return urlToConnectionOptions(WIRE_URL);
})();

// ==== Helpers REST (cache) ====
export function buildCacheKey(...parts: (string | number | null | undefined)[]) {
    return [REDIS_NAMESPACE, ...parts.filter(Boolean)].join(':');
}
export const k = (...parts: (string | number | null | undefined)[]) => buildCacheKey(...parts);

type RedisJSON =
    | string
    | number
    | boolean
    | null
    | { [k: string]: RedisJSON }
    | RedisJSON[];

export async function rPing(timeoutMs = 1500): Promise<boolean> {
    const to = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Redis timeout')), timeoutMs));
    try {
        await Promise.race([redis.get('__health__'), to]);
    } catch {
        if (isDev) console.error('[redis.get] connectivity/token error');
        return false;
    }
    try {
        await Promise.race([redis.ping(), to]);
    } catch {
        if (isDev) console.warn('[redis.ping] blocked or unsupported, continuing…');
    }
    return true;
}

export async function rSet<T extends RedisJSON>(key: string, value: T, ttlSec = REDIS_TTL) {
    return redis.set(buildCacheKey(key), value, { ex: ttlSec });
}
export async function rGet<T = unknown>(key: string) {
    return redis.get<T>(buildCacheKey(key));
}
export async function rDel(key: string) {
    return redis.del(buildCacheKey(key));
}

/** Health check: sólo en development (nunca en test ni producción) */
if (isDev) {
    (async () => {
        try {
            const ok = await rPing();
            await rSet('__boot__', { t: Date.now() }, 60);
            const v = await rGet<{ t: number }>('__boot__');
            console.log('[redis] health:', ok, '| ns:', REDIS_NAMESPACE, '| get __boot__:', Boolean(v));
        } catch (err) {
            console.error('[redis] startup check failed:', err);
        }
    })();
}
