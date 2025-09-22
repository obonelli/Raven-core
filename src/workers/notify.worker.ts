import type { Job } from 'bullmq';
import { mkWorker, mkQueueEvents } from '../config/bull.js';
import { prisma } from '../config/prisma.js';
import { markNotifSent } from '../repositories/reminder.mysql.repo.js';
import { sendEmail } from '../providers/email.js';
import { sendWhatsApp } from '../providers/whatsapp.js'; // <-- NUEVO

type NotifyJobData = { reminderId: string; notificationId: string };

async function handler(job: Job<NotifyJobData>) {
    const { reminderId, notificationId } = job.data;

    const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });
    if (!reminder) return;

    // ahora pedimos email y waid (WhatsApp id / phone completo, ej 52181...)
    const user = await prisma.$queryRawUnsafe<{ email?: string; waid?: string }[]>(
        'SELECT email, waid FROM UserLookup WHERE userId = ? LIMIT 1',
        reminder.userId
    );

    const title = reminder.title;
    const when = new Date(reminder.dueAt).toLocaleString('es-MX', { timeZone: reminder.tz });

    if (reminder.channel === 'EMAIL') {
        await sendEmail({
            to: user?.[0]?.email ?? process.env.DEBUG_EMAIL!,
            subject: `Reminder: ${title}`,
            text: `${title}\n⏰ ${when}\nActions: reply "snooze 30" | "done"`,
        });
    } else if (reminder.channel === 'WHATSAPP') {
        const toWaid = user?.[0]?.waid; // ej "52181XXXXXXXX"
        if (toWaid) {
            await sendWhatsApp({
                toWaid,
                text: `⏰ Recordatorio: ${title}\n${when}`,
            });
        } else {
            console.warn('[notify] no waid for user', reminder.userId);
        }
    }

    await markNotifSent(notificationId, job.id?.toString() ?? null);
}

// En test/dev con BULL_DISABLED se crean No-Op; en prod usan bullConnection real.
export const notifyWorker = mkWorker<NotifyJobData>('notify', handler);
export const notifyEvents = mkQueueEvents('notify');

notifyEvents.on('failed', (e) => console.error('[notify.failed]', e));
