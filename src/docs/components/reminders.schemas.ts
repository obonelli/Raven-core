// src/docs/components/reminders.schemas.ts
export const remindersSchemas = {
    // Entidad principal que devuelve tu API
    Reminder: {
        type: 'object',
        required: ['id', 'userId', 'title', 'status', 'dueAtISO'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 1, maxLength: 255 },
            notes: { type: ['string', 'null'] },
            category: { type: ['string', 'null'] },
            channel: { type: ['string', 'null'], enum: ['EMAIL', 'WHATSAPP', 'SMS', null] },
            status: { type: 'string', description: 'e.g. PENDING, DONE, SNOOZED' },
            dueAtISO: { type: 'string', description: 'ISO-8601 datetime string' },
            rrule: { type: ['string', 'null'] },
            tz: { type: ['string', 'null'] },
            nlgPayload: { type: ['object', 'null'], additionalProperties: true },
            createdAt: { type: ['string', 'null'] },
            updatedAt: { type: ['string', 'null'] },
        },
        example: {
            id: '3c9f9b9e-4d1c-4b3b-9b79-7a2a8f8f9a10',
            userId: '8e86a1d4-5ff7-4aa7-9a65-1b2f5f40a4f6',
            title: 'Pagar luz',
            notes: 'Antes del viernes',
            category: 'pagos',
            channel: 'WHATSAPP',
            status: 'PENDING',
            dueAtISO: '2025-09-22T15:00:00Z',
            rrule: 'FREQ=MONTHLY;BYMONTHDAY=22',
            tz: 'America/Mexico_City',
            nlgPayload: { source: 'nlp-v1' },
            createdAt: '2025-09-21T18:20:00Z',
            updatedAt: '2025-09-21T18:20:00Z',
        },
    },

    // ==== Inputs (alineados con tus Zod schemas) ====
    ParseReminderInput: {
        type: 'object',
        required: ['text'],
        properties: {
            text: { type: 'string', minLength: 1 },
            tz: { type: 'string' },
        },
        example: { text: 'Recuérdame pagar la luz el 22 a las 10am', tz: 'America/Mexico_City' },
    },

    // Salida esperada del parser (flexible)
    ParsedReminderOutput: {
        type: 'object',
        properties: {
            title: { type: 'string' },
            notes: { type: 'string' },
            dueAtISO: { type: 'string', description: 'ISO-8601 datetime (si se detectó)' },
            rrule: { type: 'string' },
            tz: { type: 'string' },
            channel: { type: 'string', enum: ['EMAIL', 'WHATSAPP', 'SMS'] },
            category: { type: 'string' },
            nlgPayload: { type: 'object', additionalProperties: true },
            // puedes añadir otros campos que devuelva tu parseSvc
        },
        example: {
            title: 'Pagar luz',
            dueAtISO: '2025-09-22T15:00:00Z',
            tz: 'America/Mexico_City',
            rrule: 'FREQ=MONTHLY;BYMONTHDAY=22',
            category: 'pagos',
            channel: 'WHATSAPP',
            nlgPayload: { confidence: 0.93 },
        },
    },

    CreateReminderInput: {
        type: 'object',
        required: ['userId', 'title', 'dueAtISO'],
        properties: {
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 1, maxLength: 255 },
            notes: { type: 'string' },
            category: { type: 'string' },
            channel: { type: 'string', enum: ['EMAIL', 'WHATSAPP', 'SMS'] },
            dueAtISO: { type: 'string' },
            rrule: { type: 'string' },
            tz: { type: 'string' },
            nlgPayload: { type: 'object', additionalProperties: true },
        },
        example: {
            userId: '8e86a1d4-5ff7-4aa7-9a65-1b2f5f40a4f6',
            title: 'Pagar luz',
            notes: 'Antes del viernes',
            category: 'pagos',
            channel: 'WHATSAPP',
            dueAtISO: '2025-09-22T15:00:00Z',
            rrule: 'FREQ=MONTHLY;BYMONTHDAY=22',
            tz: 'America/Mexico_City',
            nlgPayload: { source: 'ui' },
        },
    },

    ListRemindersQuery: {
        type: 'object',
        properties: {
            userId: { type: 'string', format: 'uuid' },
            from: { type: 'string', description: 'ISO-8601 desde' },
            to: { type: 'string', description: 'ISO-8601 hasta' },
            status: { type: 'string', description: 'Filtro de estado' },
        },
    },

    SnoozeReminderInput: {
        type: 'object',
        properties: {
            minutes: {
                type: 'integer',
                minimum: 1,
                maximum: 10080,
                description: 'Minutos a posponer (hasta 7 días)',
            },
        },
        example: { minutes: 30 },
    },

    ReminderList: {
        type: 'array',
        items: { $ref: '#/components/schemas/Reminder' },
    },
};
