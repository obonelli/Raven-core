// src/debug/redis-wire-check.ts (temporal y minimal, sin any y sin tocar tsconfig)
import { bullConnection } from '../config/redis.js';

export async function testRedisWireOnce() {
    // Carga dinámica compatible con CJS/ESM
    const mod = (await import('ioredis')) as unknown;
    const picked = (mod as { default?: unknown }).default ?? mod;

    type WireOpts = {
        host?: string | undefined;
        port?: number | undefined;
        password?: string | undefined;
        tls?: Record<string, unknown> | undefined;
    };

    type RedisClient = {
        ping(): Promise<string>;
        disconnect(): void;
    };

    // Constructor mínimo que necesitamos
    type RedisCtor = new (options: WireOpts) => RedisClient;
    const IORedis = picked as unknown as RedisCtor;

    const src = bullConnection as unknown as {
        host?: string | undefined;
        port?: number | undefined;
        password?: string | undefined;
        tls?: Record<string, unknown> | undefined;
    };

    const options: WireOpts = {
        host: src.host,
        port: src.port,
        password: src.password,
        tls: src.tls ? {} : undefined,
    };

    const client = new IORedis(options);

    try {
        const pong = await client.ping();
        console.log('[wire] PING ->', pong);
    } catch (e) {
        console.error('[wire] error', e);
    } finally {
        client.disconnect();
    }
}
