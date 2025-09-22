import { Queue, JobsOptions } from 'bullmq';
import { prisma } from '../config/prisma.js';
import { bullConnection } from '../config/redis.js';

// Cola "notify" (la misma que consume notify.worker.ts)
const notifyQueue = new Queue('notify', { connection: bullConnection });

type EnqueueParams = {
    reminderId: string;
    runAt: Date; // fecha exacta
};

export async function enqueueReminderJob({ reminderId, runAt }: EnqueueParams) {
    // 1) Creamos registro Notification
    const notif = await prisma.notification.create({
        data: {
            reminderId,
            scheduledAt: runAt,
            status: 'PENDING',
        },
    });

    // 2) Calculamos delay (ms) hasta la fecha
    const delay = Math.max(0, runAt.getTime() - Date.now());

    const opts: JobsOptions = {
        delay,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
    };

    // 3) Encolamos en "notify" con el notificationId
    await notifyQueue.add('notify', { reminderId, notificationId: notif.id }, opts);

    return notif.id;
}
