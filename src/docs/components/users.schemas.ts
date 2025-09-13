// src/docs/components/users.schemas.ts
export const usersSchemas = {
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
};
