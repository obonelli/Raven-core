// src/docs/paths/reminders.ts
export const remindersPaths = {
    '/api/reminders/parse': {
        post: {
            tags: ['Reminders'],
            summary: 'Parse natural language into a reminder payload',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ParseReminderInput' },
                        examples: {
                            basic: {
                                value: { text: 'Recuérdame pagar la luz el 22 a las 10am', tz: 'America/Mexico_City' },
                            },
                        },
                    },
                },
            },
            responses: {
                '200': {
                    description: 'Parsed reminder data',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ParsedReminderOutput' },
                        },
                    },
                },
                '400': {
                    description: 'Invalid input',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
            },
        },
    },

    '/api/reminders': {
        get: {
            tags: ['Reminders'],
            summary: 'List reminders for a user',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                { name: 'from', in: 'query', schema: { type: 'string' }, description: 'ISO from' },
                { name: 'to', in: 'query', schema: { type: 'string' }, description: 'ISO to' },
                { name: 'status', in: 'query', schema: { type: 'string' } },
            ],
            responses: {
                '200': {
                    description: 'List of reminders',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ReminderList' },
                        },
                    },
                },
            },
        },

        post: {
            tags: ['Reminders'],
            summary: 'Create a reminder and enqueue notification',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateReminderInput' },
                    },
                },
            },
            responses: {
                '201': {
                    description: 'Created reminder',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Reminder' },
                        },
                    },
                },
                '400': {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                        },
                    },
                },
            },
        },
    },

    '/api/reminders/{id}/snooze': {
        parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        post: {
            tags: ['Reminders'],
            summary: 'Snooze a reminder by N minutes',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: false,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/SnoozeReminderInput' },
                        examples: { default: { value: { minutes: 30 } } },
                    },
                },
            },
            responses: {
                '200': {
                    description: 'Snoozed reminder',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Reminder' },
                        },
                    },
                },
                '404': {
                    description: 'Reminder not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: { notFound: { value: { error: 'Reminder not found' } } },
                        },
                    },
                },
            },
        },
    },

    '/api/reminders/{id}/done': {
        parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        post: {
            tags: ['Reminders'],
            summary: 'Mark a reminder as completed',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Completed reminder',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Reminder' },
                        },
                    },
                },
                '404': {
                    description: 'Reminder not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: { notFound: { value: { error: 'Reminder not found' } } },
                        },
                    },
                },
            },
        },
    },
};
