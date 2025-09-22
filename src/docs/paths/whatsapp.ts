// docs/paths/whatsapp.ts

export const whatsappPaths = {
    '/webhooks/whatsapp': {
        get: {
            tags: ['Webhooks'],
            summary: 'Verify Meta WhatsApp webhook',
            description:
                'Meta sends a GET request with hub.verify_token and hub.challenge to validate the webhook.',
            parameters: [
                {
                    in: 'query',
                    name: 'hub.mode',
                    required: true,
                    schema: { type: 'string', enum: ['subscribe'] },
                },
                {
                    in: 'query',
                    name: 'hub.verify_token',
                    required: true,
                    schema: { type: 'string' },
                },
                {
                    in: 'query',
                    name: 'hub.challenge',
                    required: true,
                    schema: { type: 'string' },
                },
            ],
            responses: {
                200: {
                    description: 'Challenge echoed (plain text)',
                    content: {
                        'text/plain': {
                            schema: { type: 'string', example: '1234567890' },
                        },
                    },
                },
                403: {
                    description: 'Invalid verify token',
                },
            },
        },
        post: {
            tags: ['Webhooks'],
            summary: 'Receive WhatsApp webhook events',
            description:
                'Handles inbound messages and status updates from WhatsApp Business. Always respond with 200.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/WhatsAppWebhookPayload' },
                    },
                },
            },
            responses: {
                200: { description: 'Acknowledged' },
            },
        },
    },
};
