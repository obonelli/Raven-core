// src/docs/components/health.schemas.ts
export const healthSchemas = {
    HealthStatus: {
        type: 'object',
        required: ['ok', 'service'],
        properties: {
            ok: { type: 'boolean' },
            service: { type: 'string', enum: ['dynamo', 'mysql', 'redis'] },
        },
        examples: {
            dynamo: { value: { ok: true, service: 'dynamo' } },
            mysql: { value: { ok: true, service: 'mysql' } },
            redis: { value: { ok: true, service: 'redis' } },
        },
    },
};
