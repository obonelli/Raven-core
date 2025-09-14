export const authSchemas = {
    AuthUser: {
        type: 'object',
        required: ['id', 'email'],
        properties: {
            id: { type: 'string', description: 'User ID (UUID or ULID)' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', nullable: true },
        },
        example: { id: '8e86a1d4-5ff7-4aa7-9a65-1b2f5f40a4f6', email: 'alice@example.com', role: 'admin' },
    },

    AuthLoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
        },
        examples: {
            alice: { value: { email: 'alice@example.com', password: 'secret123' } },
            bob: { value: { email: 'bob@example.com', password: 'P@ssw0rd!' } },
        },
    },

    AuthTokens: {
        type: 'object',
        required: ['accessToken', 'refreshToken'],
        properties: {
            accessToken: { type: 'string', description: 'JWT access token' },
            refreshToken: { type: 'string', description: 'JWT refresh token' },
        },
        example: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IlJFRlJFU0gifQ...',
        },
    },

    AuthLoginResponse: {
        type: 'object',
        required: ['user', 'accessToken', 'refreshToken'],
        properties: {
            user: { $ref: '#/components/schemas/AuthUser' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
        },
    },

    AuthRefreshInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
            refreshToken: { type: 'string' },
        },
        example: { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IlJFRlJFU0gifQ...' },
    },

    AuthRefreshResponse: {
        type: 'object',
        required: ['accessToken', 'refreshToken'],
        properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
        },
    },

    AuthLogoutInput: {
        type: 'object',
        properties: {
            refreshToken: { type: 'string', description: 'Optional; if present it will be revoked' },
        },
        example: { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IlJFRlJFU0gifQ...' },
    },

    Ok: {
        type: 'object',
        required: ['ok'],
        properties: { ok: { type: 'boolean' } },
        example: { ok: true },
    },
};
