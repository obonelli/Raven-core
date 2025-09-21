// src/schemas/reminders.schema.ts
import { z } from 'zod';

export const ParseReminderSchema = z.object({
    text: z.string().min(1, 'text is required'),
    tz: z.string().optional(),
});

export const CreateReminderSchema = z.object({
    userId: z.string().min(1),
    title: z.string().min(1).max(255),
    notes: z.string().optional(),
    category: z.string().optional(),
    channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS']).optional(),
    dueAtISO: z.string().min(1), // ISO date
    rrule: z.string().optional(),
    tz: z.string().optional(),
    nlgPayload: z.any().optional(),
});

export const ListRemindersQuerySchema = z.object({
    userId: z.string().min(1),
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.string().optional(),
});

export const SnoozeReminderSchema = z.object({
    minutes: z.coerce.number().int().positive().max(10080).optional(), // hasta 7 días
});
