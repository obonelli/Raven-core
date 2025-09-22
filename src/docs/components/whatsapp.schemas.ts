// docs/components/whatsapp.schemas.ts

export const whatsappSchemas = {
    WhatsAppWebhookPayload: {
        type: 'object',
        required: ['object', 'entry'],
        properties: {
            object: {
                type: 'string',
                example: 'whatsapp_business_account',
            },
            entry: {
                type: 'array',
                items: { $ref: '#/components/schemas/WppEntry' },
            },
        },
    },
    WppEntry: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'WABA ID' },
            changes: {
                type: 'array',
                items: { $ref: '#/components/schemas/WppChange' },
            },
        },
    },
    WppChange: {
        type: 'object',
        properties: {
            field: { type: 'string', example: 'messages' },
            value: { $ref: '#/components/schemas/WppChangeValue' },
        },
    },
    WppChangeValue: {
        type: 'object',
        properties: {
            messaging_product: { type: 'string', example: 'whatsapp' },
            metadata: {
                type: 'object',
                properties: {
                    display_phone_number: { type: 'string' },
                    phone_number_id: { type: 'string' },
                },
            },
            contacts: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        wa_id: { type: 'string' },
                        profile: {
                            type: 'object',
                            properties: { name: { type: 'string' } },
                        },
                    },
                },
            },
            messages: {
                type: 'array',
                items: { $ref: '#/components/schemas/WppMessage' },
            },
        },
    },
    WppMessage: {
        type: 'object',
        properties: {
            from: { type: 'string', example: '5215555555555' },
            id: { type: 'string' },
            timestamp: { type: 'string' },
            type: {
                type: 'string',
                enum: [
                    'text',
                    'image',
                    'audio',
                    'video',
                    'document',
                    'interactive',
                    'button',
                    'reaction',
                    'sticker',
                ],
            },
            text: {
                type: 'object',
                nullable: true,
                properties: { body: { type: 'string', example: 'pagar Telmex mañana 9am' } },
            },
            interactive: {
                type: 'object',
                nullable: true,
                properties: {
                    type: { type: 'string', enum: ['button_reply', 'list_reply'] },
                    button_reply: {
                        type: 'object',
                        properties: { id: { type: 'string' }, title: { type: 'string' } },
                    },
                    list_reply: {
                        type: 'object',
                        properties: { id: { type: 'string' }, title: { type: 'string' } },
                    },
                },
            },
        },
    },
};
