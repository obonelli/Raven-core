// src/docs/paths/users.ts
export const usersPaths = {
    '/api/users': {
        get: {
            tags: ['Users'],
            summary: 'List users',
            responses: {
                '200': {
                    description: 'Array of users',
                    content: {
                        'application/json': {
                            schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
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
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
                '409': {
                    description: 'Email already in use',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
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
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
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
                        },
                    },
                },
                '404': {
                    description: 'Not found',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
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
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
            },
        },
    },
};
