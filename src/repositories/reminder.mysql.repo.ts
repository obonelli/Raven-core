// src/repositories/reminder.mysql.repo.ts
import { prisma } from '../config/prisma.js';
import type { Prisma } from '@prisma/client';
import type {
    Reminder as DomainReminder,
    Notification as DomainNotif,
} from '../models/reminder.model.js';

// ==== Tipos DB inferidos directamente del cliente ====
type Awaited<T> = T extends Promise<infer U> ? U : T;
type DBReminder = Awaited<ReturnType<typeof prisma.reminder.create>>;
type DBNotification = Awaited<ReturnType<typeof prisma.notification.create>>;

type Req<T> = NonNullable<T>;

const toReminder = (r: DBReminder): DomainReminder => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    notes: r.notes ?? null,
    category: r.category ?? null,
    channel: r.channel as unknown as DomainReminder['channel'],
    status: r.status as unknown as DomainReminder['status'],
    dueAt: r.dueAt.toISOString(),
    rrule: r.rrule ?? null,
    tz: r.tz,
    nlgPayload: r.nlgPayload as unknown as DomainReminder['nlgPayload'],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
});

const toNotif = (n: DBNotification): DomainNotif => ({
    id: n.id,
    reminderId: n.reminderId,
    scheduledAt: n.scheduledAt.toISOString(),
    sentAt: n.sentAt ? n.sentAt.toISOString() : null,
    channel: n.channel as unknown as DomainNotif['channel'],
    status: n.status as unknown as DomainNotif['status'],
    providerId: n.providerId ?? null,
    error: n.error ?? null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
});

export async function createReminder(input: {
    userId: string;
    title: string;
    notes?: string;                 // si quieres permitir null explícito, cambia a string | null
    category?: string;              // idem
    channel?: 'EMAIL' | 'WHATSAPP' | 'SMS';
    dueAt: Date;
    rrule?: string;
    tz: string;
    nlgPayload?: unknown;           // JSON (opcional)
}) {
    // Importante: para opcionales con tipo `string | null` en Prisma,
    // NO asignes `undefined`. Si no hay valor, omite la propiedad.
    const data: Prisma.ReminderCreateInput = {
        userId: input.userId,
        title: input.title,
        ...(input.notes !== undefined && { notes: input.notes }),           // string | null ok
        ...(input.category !== undefined && { category: input.category }),  // string | null ok
        channel: (input.channel ?? 'EMAIL') as unknown as Req<
            Prisma.ReminderCreateInput['channel']
        >,
        status: 'QUEUED' as unknown as Req<Prisma.ReminderCreateInput['status']>,
        dueAt: input.dueAt,
        ...(input.rrule !== undefined && { rrule: input.rrule }),           // string | null ok
        tz: input.tz,
        ...(input.nlgPayload !== undefined && {
            nlgPayload: input.nlgPayload as Prisma.InputJsonValue,            // JSON
        }),
    };

    const row = await prisma.reminder.create({ data });
    return toReminder(row as DBReminder);
}

export async function getReminder(id: string) {
    const r = (await prisma.reminder.findUnique({ where: { id } })) as
        | DBReminder
        | null;
    return r ? toReminder(r) : null;
}

export async function listReminders(
    userId: string,
    opts?: { from?: Date; to?: Date; status?: string }
) {
    const where: Prisma.ReminderWhereInput = { userId };

    if (opts?.status) {
        (where as Record<string, unknown>).status =
            opts.status as unknown as Req<Prisma.ReminderWhereInput['status']>;
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
        ...(data.channel !== undefined && {
            channel: data.channel as unknown as Req<Prisma.ReminderUpdateInput['channel']>,
        }),
        ...(data.status !== undefined && {
            status: data.status as unknown as Req<Prisma.ReminderUpdateInput['status']>,
        }),
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
    // Usa la variante que corresponda a tu schema:
    // Opción A: FK escalar exposed
    // const data: Prisma.NotificationCreateInput = {
    //   // @ts-expect-error si CreateInput no expone reminderId, usa la B.
    //   reminderId: input.reminderId,
    //   scheduledAt: input.scheduledAt,
    //   channel: input.channel as unknown as Req<Prisma.NotificationCreateInput['channel']>,
    //   status: 'PENDING' as unknown as Req<Prisma.NotificationCreateInput['status']>,
    // };

    // Opción B: relación
    const data: Prisma.NotificationCreateInput = {
        reminder: { connect: { id: input.reminderId } },
        scheduledAt: input.scheduledAt,
        channel: input.channel as unknown as Req<Prisma.NotificationCreateInput['channel']>,
        status: 'PENDING' as unknown as Req<Prisma.NotificationCreateInput['status']>,
    };

    const row = (await prisma.notification.create({ data })) as DBNotification;
    return toNotif(row);
}

export async function markNotifSent(id: string, providerId?: string | null) {
    // Para enums en updates usa `{ set: ... }`
    const raw = {
        status: { set: 'SENT' },
        sentAt: new Date(),
        ...(providerId !== undefined && { providerId }), // string | null
    };
    const data = raw as unknown as Prisma.NotificationUpdateInput;

    const row = (await prisma.notification.update({
        where: { id },
        data,
    })) as DBNotification;

    return toNotif(row);
}
