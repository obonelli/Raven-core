// src/docs/components/health.schemas.ts
export const healthSchemas = {
    HealthStatus: {
        type: 'object',
        required: ['ok', 'service'],
        properties: {
            ok: { type: 'boolean' },
            service: { type: 'string', enum: ['dynamo', 'mysql'] },
        },
        example: { ok: true, service: 'dynamo' },
    },
};
