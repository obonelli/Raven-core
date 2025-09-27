export const authPaths = {
    '/api/auth/login': {
        post: {
            tags: ['Auth'],
            summary: 'Login with email and password',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AuthLoginInput' },
                    },
                },
            },
            responses: {
                '200': {
                    description: 'Authenticated; tokens issued',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/AuthLoginResponse' },
                            examples: {
                                ok: {
                                    value: {
                                        user: { id: '8e86a1d4-5ff7-4aa7-9a65-1b2f5f40a4f6', email: 'alice@example.com', role: 'admin' },
                                        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IlJFRlJFU0gifQ...',
                                    },
                                },
                            },
                        },
                    },
                },
                '401': {
                    description: 'Invalid credentials',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
            },
        },
    },

    '/api/auth/refresh': {
        post: {
            tags: ['Auth'],
            summary: 'Rotate refresh token and get a new access token',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AuthRefreshInput' },
                    },
                },
            },
            responses: {
                '200': {
                    description: 'New pair of tokens',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/AuthRefreshResponse' },
                        },
                    },
                },
                '401': {
                    description: 'Invalid or inactive refresh token',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
            },
        },
    },

    '/api/auth/logout': {
        post: {
            tags: ['Auth'],
            summary: 'Logout (revoke refresh token if provided)',
            requestBody: {
                required: false,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AuthLogoutInput' },
                    },
                },
            },
            responses: {
                '200': {
                    description: 'Logged out',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Ok' } } },
                },
            },
        },
    },

    '/api/auth/me': {
        get: {
            tags: ['Auth'],
            summary: 'Get current authenticated user (requires Bearer access token)',
            security: [{ bearerAuth: [] }], // <-- necesario para que Swagger envíe Authorization
            responses: {
                '200': {
                    description: 'Current user',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['user'],
                                properties: { user: { $ref: '#/components/schemas/AuthUser' } },
                            },
                        },
                    },
                },
                '401': {
                    description: 'Unauthorized (missing/invalid token)',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
                },
            },
        },
    },
};
