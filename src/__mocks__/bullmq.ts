// __mocks__/bullmq.ts

export type JobsOptions = Record<string, unknown>;
export type QueueOptions = Record<string, unknown>;
export type WorkerOptions = Record<string, unknown>;

export type Processor<T = unknown> = (
    job: { data: T; id?: string }
) => Promise<void> | void;

type Listener = (...args: unknown[]) => void;

export class Queue<T = unknown> {
    name: string;

    constructor(name: string, _opts?: QueueOptions) {
        this.name = name;
    }

    add(_name: string, _data: T, _opts?: JobsOptions) {
        return Promise.resolve({ id: 'mock-job' as const });
    }

    close(): Promise<void> {
        return Promise.resolve();
    }

    on(_e: string, _fn?: Listener): void {
        // no-op
    }
}

export class Worker<T = unknown> {
    name: string;

    constructor(name: string, _proc: Processor<T>, _opts?: WorkerOptions) {
        this.name = name;
    }

    close(): Promise<void> {
        return Promise.resolve();
    }

    on(_e: string, _fn?: Listener): void {
        // no-op
    }
}

export class QueueEvents {
    name: string;

    constructor(name: string, _opts?: Record<string, unknown>) {
        this.name = name;
    }

    close(): Promise<void> {
        return Promise.resolve();
    }

    on(_e: string, _fn?: Listener): void {
        // no-op
    }
}
