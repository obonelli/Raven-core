// src/workers/notify.worker.ts
import type { Job } from 'bullmq';
import { mkWorker, mkQueueEvents } from '../config/bull.js';
import { prisma } from '../config/prisma.js';
import { markNotifSent } from '../repositories/reminder.mysql.repo.js';
import { sendEmail } from '../providers/email.js';
// import { sendWhatsApp } from '../providers/whatsapp.js';

type NotifyJobData = { reminderId: string; notificationId: string };

async function handler(job: Job<NotifyJobData>) {
    const { reminderId, notificationId } = job.data;

    const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });
    if (!reminder) return;

    const user = await prisma.$queryRawUnsafe<{ email?: string }[]>(
        'SELECT email FROM UserLookup WHERE userId = ? LIMIT 1',
        reminder.userId
    ); // TODO: reemplazar por tu lookup real (HTTP/Dynamo/etc.)

    const title = reminder.title;
    const when = new Date(reminder.dueAt).toLocaleString('es-MX', { timeZone: reminder.tz });

    if (reminder.channel === 'EMAIL') {
        await sendEmail({
            to: user?.[0]?.email ?? process.env.DEBUG_EMAIL!,
            subject: `Reminder: ${title}`,
            text: `${title}\n⏰ ${when}\nActions: reply "snooze 30" | "done"`,
        });
    }
    // else if (reminder.channel === 'WHATSAPP') { await sendWhatsApp(...); }

    await markNotifSent(notificationId, job.id?.toString() ?? null);
}

// En test/dev con BULL_DISABLED se crean No-Op; en prod usan bullConnection real.
export const notifyWorker = mkWorker<NotifyJobData>('notify', handler);
export const notifyEvents = mkQueueEvents('notify');

notifyEvents.on('failed', (e) => console.error('[notify.failed]', e));
