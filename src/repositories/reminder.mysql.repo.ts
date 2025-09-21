// src/repositories/reminder.mysql.repo.ts
import { prisma } from '../config/prisma.js';
import type { Prisma } from '@prisma/client';
import type {
    Reminder as DomainReminder,
    Notification as DomainNotif,
} from '../models/reminder.model.js';

// ==== Tipos DB inferidos directamente del cliente ====
// (evitamos Reminder/Notification y GetPayload que cambian entre versiones)
type Awaited<T> = T extends Promise<infer U> ? U : T;
type DBReminder = Awaited<ReturnType<typeof prisma.reminder.create>>;
type DBNotification = Awaited<ReturnType<typeof prisma.notification.create>>;

const toReminder = (r: DBReminder): DomainReminder => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    notes: r.notes ?? null,
    category: r.category ?? null,
    channel: r.channel as any,
    status: r.status as any,
    dueAt: r.dueAt.toISOString(),
    rrule: r.rrule ?? null,
    tz: r.tz,
    nlgPayload: r.nlgPayload as any,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
});

const toNotif = (n: DBNotification): DomainNotif => ({
    id: n.id,
    reminderId: n.reminderId,
    scheduledAt: n.scheduledAt.toISOString(),
    sentAt: n.sentAt ? n.sentAt.toISOString() : null,
    channel: n.channel as any,
    status: n.status as any,
    providerId: n.providerId ?? null,
    error: n.error ?? null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
});

export async function createReminder(input: {
    userId: string;
    title: string;
    notes?: string;
    category?: string;
    channel?: 'EMAIL' | 'WHATSAPP' | 'SMS';
    dueAt: Date;
    rrule?: string;
    tz: string;
    nlgPayload?: unknown;
}) {
    const row = await prisma.reminder.create({
        data: {
            userId: input.userId,
            title: input.title,
            ...(input.notes !== undefined && { notes: input.notes }),
            ...(input.category !== undefined && { category: input.category }),
            channel: (input.channel ?? 'EMAIL') as any,
            status: 'QUEUED' as any,
            dueAt: input.dueAt,
            ...(input.rrule !== undefined && { rrule: input.rrule }),
            tz: input.tz,
            ...(input.nlgPayload !== undefined && { nlgPayload: input.nlgPayload as any }),
        },
    });
    return toReminder(row as DBReminder);
}

export async function getReminder(id: string) {
    const r = (await prisma.reminder.findUnique({ where: { id } })) as DBReminder | null;
    return r ? toReminder(r) : null;
}

export async function listReminders(
    userId: string,
    opts?: { from?: Date; to?: Date; status?: string }
) {
    const where: Prisma.ReminderWhereInput = { userId };

    if (opts?.status) {
        (where as any).status = opts.status as any;
    }

    if (opts?.from || opts?.to) {
        where.dueAt = {
            ...(opts?.from && { gte: opts.from }),
            ...(opts?.to && { lte: opts.to }),
        };
    }

    const items = (await prisma.reminder.findMany({
        where,
        orderBy: { dueAt: 'asc' },
    })) as DBReminder[];

    return items.map(toReminder);
}

export async function updateReminder(
    id: string,
    data: Partial<{
        title: string;
        notes: string | null;
        category: string | null;
        channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
        status: 'QUEUED' | 'ACTIVE' | 'PAUSED' | 'DONE' | 'CANCELED';
        dueAt: Date;
        rrule: string | null;
        tz: string;
    }>
) {
    const safeData: Prisma.ReminderUpdateInput = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.channel !== undefined && { channel: data.channel as any }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.dueAt !== undefined && { dueAt: data.dueAt }),
        ...(data.rrule !== undefined && { rrule: data.rrule }),
        ...(data.tz !== undefined && { tz: data.tz }),
    };

    const row = (await prisma.reminder.update({
        where: { id },
        data: safeData,
    })) as DBReminder;

    return toReminder(row);
}

export async function deleteReminder(id: string) {
    await prisma.reminder.delete({ where: { id } });
}

export async function createNotif(input: {
    reminderId: string;
    scheduledAt: Date;
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
}) {
    const row = (await prisma.notification.create({
        data: {
            reminderId: input.reminderId,
            scheduledAt: input.scheduledAt,
            channel: input.channel as any,
            status: 'PENDING' as any,
        },
    })) as DBNotification;

    return toNotif(row);
}

export async function markNotifSent(id: string, providerId?: string | null) {
    const data: Prisma.NotificationUpdateInput = {
        status: 'SENT' as any,
        sentAt: new Date(),
        ...(providerId !== undefined && { providerId }), // string | null válido
    };

    const row = (await prisma.notification.update({
        where: { id },
        data,
    })) as DBNotification;

    return toNotif(row);
}
