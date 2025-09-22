// src/config/bull.ts
import type {
    JobsOptions,
    Processor,
    QueueOptions,
    WorkerOptions,
} from 'bullmq';
import {
    Queue as RealQueue,
    Worker as RealWorker,
    QueueEvents as RealQueueEvents,
} from 'bullmq';
import { bullConnection } from './redis.js';

const isTest = (process.env.NODE_ENV ?? 'development') === 'test';
const disabled = isTest || process.env.BULL_DISABLED === 'true';

type Listener = (...args: unknown[]) => void;

/** No-ops para test: mismas firmas públicas mínimas */
class NoopQueue<T = unknown> {
    name: string;
    constructor(name: string, _opts?: QueueOptions) {
        this.name = name;
    }
    add(_name: string, _data: T, _opts?: JobsOptions) {
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
    constructor(name: string, _processor: Processor<T>, _opts?: WorkerOptions) {
        this.name = name;
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
    constructor(name: string, _opts?: Record<string, unknown>) {
        this.name = name;
    }
    close(): Promise<void> {
        return Promise.resolve();
    }
    on(_event: string, _listener?: Listener): void {
        // no-op
    }
}

/** Factories seguras: en test devuelven Noop*, en dev/prod usan BullMQ real */
export const mkQueue = <T = unknown>(name: string, opts?: QueueOptions) =>
    disabled
        ? (new NoopQueue<T>(name, opts) as unknown as RealQueue<T>)
        : new RealQueue<T>(name, { connection: bullConnection, ...opts });

export const mkWorker = <T = unknown>(
    name: string,
    processor: Processor<T>,
    opts?: WorkerOptions
) =>
    disabled
        ? (new NoopWorker<T>(name, processor, opts) as unknown as RealWorker<T>)
        : new RealWorker<T>(name, processor, {
            connection: bullConnection,
            ...opts,
        });

export const mkQueueEvents = (name: string, opts?: Record<string, unknown>) =>
    disabled
        ? (new NoopQueueEvents(name, opts) as unknown as RealQueueEvents)
        : new RealQueueEvents(name, { connection: bullConnection, ...opts });
