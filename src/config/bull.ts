// src/config/bull.ts
import type {
    JobsOptions,
    Processor,
    QueueOptions,
    WorkerOptions,
    QueueEventsOptions,
} from 'bullmq';
import {
    Queue as RealQueue,
    Worker as RealWorker,
    QueueEvents as RealQueueEvents,
} from 'bullmq';
import { bullConnection } from './redis.js';

/** Helpers ----------------------------------------------------------------- */
const isTest = (process.env.NODE_ENV ?? 'development') === 'test';
const isTruthy = (v?: string) => (v ?? '').toLowerCase() === 'true';
const disabled = isTest || isTruthy(process.env.BULL_DISABLED);

/**
 * Prefijo para aislar colas por ambiente/proyecto.
 * - Usa BULL_PREFIX si existe; si no, usa el NODE_ENV.
 * - No modifica el nombre público que recibes; sólo añade `prefix` al Redis keyspace.
 */
const queuePrefix =
    process.env.BULL_PREFIX ??
    (process.env.NODE_ENV ? `bull:${process.env.NODE_ENV}` : 'bull:dev');

/** Listener genérico (evita `any`) */
type Listener = (...args: unknown[]) => void;

/** --------------------------- No-ops para test ---------------------------- */
/** Mismas firmas mínimas; devuelven estructuras compatibles para no romper await */
class NoopQueue<T = unknown> {
    name: string;
    constructor(name: string, _opts?: QueueOptions) {
        this.name = name;
    }
    add(_name: string, _data: T, _opts?: JobsOptions) {
        // imitamos una Job con id
        return Promise.resolve({ id: 'noop' as const });
    }
    close(): Promise<void> {
        return Promise.resolve();
    }
    on(_event: string, _listener?: Listener): void {
        // no-op
    }
}

class NoopWorker<T = unknown> {
    name: string;
    constructor(_name: string, _processor: Processor<T>, _opts?: WorkerOptions) {
        this.name = _name;
    }
    close(): Promise<void> {
        return Promise.resolve();
    }
    on(_event: string, _listener?: Listener): void {
        // no-op
    }
}

class NoopQueueEvents {
    name: string;
    constructor(name: string, _opts?: QueueEventsOptions) {
        this.name = name;
    }
    close(): Promise<void> {
        return Promise.resolve();
    }
    on(_event: string, _listener?: Listener): void {
        // no-op
    }
}

/** ------------------------------ Factories -------------------------------- */
/**
 * Crea una Queue. En test / cuando BULL_DISABLED==='true' devuelve NoopQueue.
 * En dev/prod, devuelve BullMQ Queue real con `connection` y `prefix`.
 */
export const mkQueue = <T = unknown>(name: string, opts?: QueueOptions) =>
    disabled
        ? ((new NoopQueue<T>(name, opts)) as unknown as RealQueue<T>)
        : new RealQueue<T>(name, {
            connection: bullConnection,
            prefix: queuePrefix,
            // valores por defecto seguros; se pueden sobreescribir en opts
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 60_000 },
                removeOnComplete: true,
                removeOnFail: false,
            },
            ...opts,
        });

/**
 * Crea un Worker. En test / disabled devuelve NoopWorker.
 */
export const mkWorker = <T = unknown>(
    name: string,
    processor: Processor<T>,
    opts?: WorkerOptions
) =>
    disabled
        ? ((new NoopWorker<T>(name, processor, opts)) as unknown as RealWorker<T>)
        : new RealWorker<T>(name, processor, {
            connection: bullConnection,
            // Sane defaults; override via opts si necesitas
            concurrency: opts?.concurrency ?? 5,
            // Evita re-procesar jobs huérfanos demasiado seguido
            stalledInterval: opts?.stalledInterval ?? 30_000,
            // Métricas ligeras
            metrics: { maxDataPoints: 100 },
            prefix: queuePrefix,
            ...opts,
        });

/**
 * Crea un QueueEvents para escuchar eventos sin levantar un Worker adicional.
 */
export const mkQueueEvents = (name: string, opts?: QueueEventsOptions) =>
    disabled
        ? ((new NoopQueueEvents(name, opts)) as unknown as RealQueueEvents)
        : new RealQueueEvents(name, {
            connection: bullConnection,
            prefix: queuePrefix,
            ...opts,
        });

/** --------------------------- Graceful shutdown --------------------------- */
/**
 * Cierra ordenadamente recursos de BullMQ (ignora errores para no tumbar procesos).
 * Útil en `process.on('SIGINT'|'SIGTERM')`.
 */
export async function closeSafely(
    ...closables: Array<{ close: () => Promise<unknown> } | undefined | null>
) {
    for (const c of closables) {
        if (!c) continue;
        try {
            await c.close();
        } catch (err) {
            console.warn('[bull.closeSafely] close error:', err);
        }
    }
}
