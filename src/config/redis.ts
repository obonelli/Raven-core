import 'dotenv/config';
import { Redis } from '@upstash/redis';

const clean = (v?: string) =>
    v?.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');

const REDIS_URL = clean(process.env.UPSTASH_REDIS_REST_URL);
const REDIS_TOKEN = clean(process.env.UPSTASH_REDIS_REST_TOKEN);

export const REDIS_NS = (process.env.REDIS_NAMESPACE ?? 'myapi').trim();
export const REDIS_TTL = Number(process.env.REDIS_TTL_SECONDS ?? 300);

if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Missing Redis envs: UPSTASH_REDIS_REST_URL / _TOKEN');
}

export const redis = new Redis({
    url: REDIS_URL!,
    token: REDIS_TOKEN!,
    automaticDeserialization: true,
});

export const k = (...parts: (string | number | null | undefined)[]) =>
    [REDIS_NS, ...parts.filter(Boolean)].join(':');

/** Health: first try GET (real connectivity). PING is optional. */
export async function rPing(timeoutMs = 1500): Promise<boolean> {
    const to = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('Redis timeout')), timeoutMs)
    );

    try {
        // Must work even with read-only token
        await Promise.race([redis.get('__health__'), to]);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[redis.get] connectivity/token error:', e);
        }
        return false;
    }

    try {
        // If it fails due to permissions, ignore it: connectivity was already verified
        await Promise.race([redis.ping(), to]);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[redis.ping] blocked or unsupported, continuing…');
        }
    }
    return true;
}

export async function rSet<T>(key: string, value: T, ttlSec = REDIS_TTL) {
    return redis.set(k(key), value as any, { ex: ttlSec });
}
export async function rGet<T = unknown>(key: string) {
    return redis.get<T>(k(key));
}
export async function rDel(key: string) {
    return redis.del(k(key));
}

/** Autotest on startup (dev only): leaves clear traces in console */
if (process.env.NODE_ENV !== 'production') {
    (async () => {
        try {
            const ok = await rPing();
            const testKey = k('__boot__');
            await rSet('__boot__', { t: Date.now() }, 60);
            const v = await rGet<typeof testKey>('__boot__');
            console.log('[redis] health:', ok, '| ns:', REDIS_NS, '| get __boot__:', Boolean(v));
        } catch (e) {
            console.error('[redis] startup check failed:', e);
        }
    })();
}
