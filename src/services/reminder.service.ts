// src/services/reminder.service.ts
import {
    createReminder,
    updateReminder,
    listReminders,
    createNotif,
} from '../repositories/reminder.mysql.repo.js';
import { mkQueue } from '../config/bull.js';

type Channel = 'EMAIL' | 'WHATSAPP' | 'SMS';

export const notifyQueue = mkQueue('notify');
export const recurQueue = mkQueue('recur');

export async function createReminderAndEnqueue(input: {
    userId: string;
    title: string;
    notes?: string;
    category?: string;
    channel?: Channel;
    dueAtISO: string;
    rrule?: string;
    tz: string;
    nlgPayload?: unknown;
}) {
    // Construimos el payload sin props undefined
    const createInput: Parameters<typeof createReminder>[0] = {
        userId: input.userId,
        title: input.title,
        dueAt: new Date(input.dueAtISO),
        tz: input.tz,
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.channel !== undefined && { channel: input.channel }),
        ...(input.rrule !== undefined && { rrule: input.rrule }),
        ...(input.nlgPayload !== undefined && { nlgPayload: input.nlgPayload }),
    };

    const reminder = await createReminder(createInput);

    // Create notification row + enqueue
    const notif = await createNotif({
        reminderId: reminder.id,
        scheduledAt: new Date(reminder.dueAt),
        channel: reminder.channel as Channel,
    });

    const delayMs = Math.max(0, new Date(reminder.dueAt).getTime() - Date.now());

    await notifyQueue.add(
        `notify:${String(reminder.channel).toLowerCase()}`,
        { reminderId: reminder.id, notificationId: notif.id },
        { delay: delayMs }
    );

    // If recurring, enqueue recur job (simplificado)
    if (reminder.rrule) {
        await recurQueue.add('advance', { reminderId: reminder.id }, { delay: 60_000 });
    }

    // Activate reminder
    await updateReminder(reminder.id, { status: 'ACTIVE' });
    return reminder;
}

export async function snoozeReminder(reminderId: string, minutes = 30) {
    const next = new Date(Date.now() + minutes * 60_000);
    return updateReminder(reminderId, { dueAt: next, status: 'ACTIVE' });
}

export async function completeReminder(reminderId: string) {
    return updateReminder(reminderId, { status: 'DONE' });
}

export async function listUserReminders(
    userId: string,
    q?: { from?: string; to?: string; status?: string }
) {
    const opts = {
        ...(q?.from && { from: new Date(q.from) }),
        ...(q?.to && { to: new Date(q.to) }),
        ...(q?.status && { status: q.status }),
    };
    return listReminders(userId, opts);
}
