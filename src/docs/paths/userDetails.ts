export const userDetailsPaths = {
    '/api/users/{id}/details': {
        parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],

        get: {
            tags: ['UserDetails'],
            summary: 'Get user details by user id',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'User details',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserDetails' },
                            examples: {
                                ok: {
                                    value: {
                                        userId: '8e86a1d4-5ff7-4aa7-9a65-1b2f5f40a4f6',
                                        phone: '+52 55 1234 5678',
                                        address: 'Av. Reforma 123',
                                        city: 'CDMX',
                                        country: 'MX',
                                        zip: '06000',
                                    },
                                },
                            },
                        },
                    },
                },
                '404': {
                    description: 'Details not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: { noDetails: { value: { error: 'Details not found' } } },
                        },
                    },
                },
            },
        },

        post: {
            tags: ['UserDetails'],
            summary: 'Create user details for a user',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateUserDetailsInput' },
                        examples: {
                            basic: {
                                value: {
                                    phone: '+52 55 1111 2222',
                                    address: 'Calle 1 #23',
                                    city: 'Guadalajara',
                                    country: 'MX',
                                    zip: '44100',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                '201': {
                    description: 'Created',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserDetails' },
                        },
                    },
                },
                '404': {
                    description: 'User not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: { noUser: { value: { error: 'User not found' } } },
                        },
                    },
                },
                '409': {
                    description: 'Details already exist',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: { exists: { value: { error: 'Details already exist' } } },
                        },
                    },
                },
            },
        },

        patch: {
            tags: ['UserDetails'],
            summary: 'Patch (partial update) user details for a user',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/PatchUserDetailsInput' },
                        examples: {
                            phoneOnly: { value: { phone: '+52 55 9999 0000' } },
                            addressOnly: { value: { address: 'Nueva 456', city: 'Monterrey' } },
                        },
                    },
                },
            },
            responses: {
                '200': {
                    description: 'Updated details',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserDetails' },
                        },
                    },
                },
                '404': {
                    description: 'User or details not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: {
                                noUser: { value: { error: 'User not found' } },
                                noDetails: { value: { error: 'Details not found' } },
                            },
                        },
                    },
                },
            },
        },

        delete: {
            tags: ['UserDetails'],
            summary: 'Delete user details for a user',
            security: [{ bearerAuth: [] }],
            responses: {
                '204': { description: 'Deleted' },
                '404': {
                    description: 'User or details not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: {
                                noUser: { value: { error: 'User not found' } },
                                noDetails: { value: { error: 'Details not found' } },
                            },
                        },
                    },
                },
            },
        },
    },
};
