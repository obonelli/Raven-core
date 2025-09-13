// src/docs/paths/health.ts
export const healthPaths = {
    '/api/health/dynamo': {
        get: {
            tags: ['Health'],
            summary: 'DynamoDB health check',
            responses: {
                '200': {
                    description: 'DynamoDB is reachable',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/HealthStatus' },
                            examples: { ok: { value: { ok: true, service: 'dynamo' } } },
                        },
                    },
                },
                '500': {
                    description: 'DynamoDB is unavailable',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
            },
        },
    },

    '/api/health/mysql': {
        get: {
            tags: ['Health'],
            summary: 'MySQL health check',
            responses: {
                '200': {
                    description: 'MySQL is reachable',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/HealthStatus' },
                            examples: { ok: { value: { ok: true, service: 'mysql' } } },
                        },
                    },
                },
                '500': {
                    description: 'MySQL is unavailable',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
            },
        },
    },
};
