import { prisma } from '../config/prisma.js';
import { DateTime } from 'luxon';
import * as chrono from 'chrono-node';
import { enqueueReminderJob } from '../workers/queue.helpers.js';
import * as userRepo from '../repositories/user.dynamo.repo.js';

type Input = {
    waid: string;       // whatsapp id (tel E.164, p.ej. +521...)
    text: string;       // frase del usuario
    tz: string;         // ej. America/Mexico_City
    channel: 'WHATSAPP' | 'EMAIL';
};

/**
 * Asegura que exista un user en Dynamo vinculado a este WAID.
 * - Busca en UserDetails (MySQL) por phone = waid.
 * - Si no existe:
 *    - crea el User en Dynamo (con datos mínimos),
 *    - persiste UserDetails { userId, phone } en MySQL.
 * Devuelve el userId (Dynamo).
 */
async function ensureUserIdForWaid(waid: string): Promise<string> {
    // 1) ¿Ya está vinculado?
    const found = await prisma.userDetails.findFirst({ where: { phone: waid } });
    if (found?.userId) return found.userId;

    // 2) Crear en Dynamo (usa tu repo oficial)
    const nowName = `WA ${waid}`;
    const nowEmail = `${waid.replace(/^\+?/, '')}@wa.local`;
    const dynUser = await userRepo.create({ name: nowName, email: nowEmail });

    // 3) Guardar el vínculo en UserDetails
    await prisma.userDetails.create({
        data: {
            userId: dynUser.userId,
            phone: waid,
        },
    });

    return dynUser.userId;
}

export async function createReminderFromText(input: Input) {
    const { text, tz, waid, channel } = input;

    // 1) parse fecha/hora
    const ref = new Date();
    const parsed = chrono.parse(text, ref, { forwardDate: true })?.[0];
    if (!parsed) return { ok: false as const };

    const title = text.replace(parsed.text, '').trim() || parsed.text.trim();

    const dueAt = parsed.date();
    const dueAtISO = dueAt.toISOString();
    const dueAtLocal = DateTime.fromJSDate(dueAt).setZone(tz).toFormat('dd/LL HH:mm');

    // 2) Resolver userId (Dynamo) a partir del waid (vía UserDetails)
    const userId = await ensureUserIdForWaid(waid);

    // 3) Crear reminder (Prisma)
    const reminder = await prisma.reminder.create({
        data: {
            userId,
            title,
            notes: text,
            category: null,
            channel,            // enum Channel
            status: 'ACTIVE',   // RemStatus
            tz,
            dueAt,
            rrule: null,
            // nlgPayload: (no lo envíes cuando no tengas contenido)
        },
    });

    // 4) Encolar job para la hora exacta
    await enqueueReminderJob({
        reminderId: reminder.id,
        runAt: dueAt,
    });

    return { ok: true as const, title, dueAtISO, dueAtLocal, reminderId: reminder.id };
}
