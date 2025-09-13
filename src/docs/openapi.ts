// src/docs/openapi.ts
// Minimal OpenAPI 3.0 spec for your current endpoints (with examples)

export function buildOpenAPISpec(baseUrl: string) {
    const spec = {
        openapi: '3.0.3',
        info: {
            title: 'My API',
            version: '1.0.0',
            description: 'Express + TypeScript API (MVC)',
        },
        servers: [{ url: baseUrl }],
        tags: [{ name: 'Users', description: 'User CRUD' }],
        paths: {
            '/health': {
                get: {
                    summary: 'Health check',
                    responses: {
                        '200': {
                            description: 'API is healthy',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['ok', 'env'],
                                        properties: {
                                            ok: { type: 'boolean' },
                                            env: { type: 'string' },
                                        },
                                    },
                                    examples: {
                                        ok: { value: { ok: true, env: 'development' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/api/users': {
                get: {
                    tags: ['Users'],
                    summary: 'List users',
                    responses: {
                        '200': {
                            description: 'Array of users',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/User' },
                                    },
                                    examples: {
                                        sample: {
                                            value: [
                                                {
                                                    userId: 'a43c5241b-2fba-41e9-94c3-0349a1a70d3d',
                                                    name: 'Alice',
                                                    email: 'alice@example.com',
                                                    createdAt: '2025-09-12T21:16:01.136Z',
                                                    updatedAt: '2025-09-12T21:16:01.136Z',
                                                },
                                                {
                                                    userId: '522b6e71-d1ed-447f-9be9-734089184900',
                                                    name: 'Bob',
                                                    email: 'bob@example.com',
                                                    createdAt: '2025-09-12T21:16:14.262Z',
                                                    updatedAt: '2025-09-12T21:16:14.262Z',
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['Users'],
                    summary: 'Create user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateUserInput' },
                                examples: {
                                    alice: { value: { name: 'Alice', email: 'alice@example.com' } },
                                    bob: { value: { name: 'Bob', email: 'bob@example.com' } },
                                    corp: { value: { name: 'Diego Martínez', email: 'diego.martinez@miempresa.com' } },
                                },
                            },
                        },
                    },
                    responses: {
                        '201': {
                            description: 'Created',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' },
                                    examples: {
                                        created: {
                                            value: {
                                                userId: '8e86a1d4-5ff7-4aa7-9a65-1b2f5f40a4f6',
                                                name: 'Alice',
                                                email: 'alice@example.com',
                                                createdAt: '2025-09-12T21:30:00.000Z',
                                                updatedAt: '2025-09-12T21:30:00.000Z',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '400': {
                            description: 'Invalid body',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' },
                                    examples: {
                                        badEmail: { value: { error: 'Invalid body' } },
                                    },
                                },
                            },
                        },
                        '409': {
                            description: 'Email already in use',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' },
                                    examples: {
                                        dup: { value: { error: 'Email already in use' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            '/api/users/{id}': {
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
                ],
                get: {
                    tags: ['Users'],
                    summary: 'Get user by id',
                    responses: {
                        '200': {
                            description: 'User',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' },
                                    examples: {
                                        ok: {
                                            value: {
                                                userId: '8e86a1d4-5ff7-4aa7-9a65-1b2f5f40a4f6',
                                                name: 'Alice',
                                                email: 'alice@example.com',
                                                createdAt: '2025-09-12T21:30:00.000Z',
                                                updatedAt: '2025-09-12T21:30:00.000Z',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '404': {
                            description: 'Not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' },
                                    examples: {
                                        noUser: { value: { error: 'User not found' } },
                                    },
                                },
                            },
                        },
                    },
                },
                patch: {
                    tags: ['Users'],
                    summary: 'Update user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateUserInput' },
                                examples: {
                                    rename: { value: { name: 'Alice Updated' } },
                                    changeEmail: { value: { email: 'alice.updated@example.com' } },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Updated user',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' },
                                    examples: {
                                        updated: {
                                            value: {
                                                userId: '8e86a1d4-5ff7-4aa7-9a65-1b2f5f40a4f6',
                                                name: 'Alice Updated',
                                                email: 'alice@example.com',
                                                createdAt: '2025-09-12T21:30:00.000Z',
                                                updatedAt: '2025-09-12T21:40:00.000Z',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        '404': {
                            description: 'Not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' },
                                    examples: { noUser: { value: { error: 'User not found' } } },
                                },
                            },
                        },
                    },
                },
                delete: {
                    tags: ['Users'],
                    summary: 'Delete user',
                    responses: {
                        '204': { description: 'Deleted' },
                        '404': {
                            description: 'Not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' },
                                    examples: { noUser: { value: { error: 'User not found' } } },
                                },
                            },
                        },
                    },
                },
            },
        },

        components: {
            schemas: {
                User: {
                    type: 'object',
                    required: ['userId', 'email', 'name', 'createdAt', 'updatedAt'],
                    properties: {
                        userId: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                CreateUserInput: {
                    type: 'object',
                    required: ['email', 'name'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string', minLength: 1 },
                    },
                    example: { name: 'Alice', email: 'alice@example.com' },
                },
                UpdateUserInput: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string', minLength: 1 },
                    },
                    examples: {
                        rename: { value: { name: 'Alice Updated' } },
                        changeEmail: { value: { email: 'alice.updated@example.com' } },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                    example: { error: 'Something went wrong' },
                },
            },
        },
    };

    return spec;
}
