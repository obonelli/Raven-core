// src/docs/openapi.ts
// Minimal OpenAPI 3.0 spec, modular by controller

import { usersPaths } from './paths/users.js';
import { usersSchemas } from './components/users.schemas.js';

import { userDetailsPaths } from './paths/userDetails.js';
import { userDetailsSchemas } from './components/userDetails.schemas.js';

import { healthPaths } from './paths/health.js';
import { healthSchemas } from './components/health.schemas.js';

export function buildOpenAPISpec(baseUrl: string) {
    const spec = {
        openapi: '3.0.3',
        info: {
            title: 'My API',
            version: '1.0.0',
            description: 'Express + TypeScript API (MVC)',
        },
        servers: [{ url: baseUrl }],
        tags: [
            { name: 'Health', description: 'Service health checks' },
            { name: 'Users', description: 'User CRUD' },
            { name: 'UserDetails', description: 'Additional details for a user (MySQL)' },
        ],
        paths: {
            // --- Health (modular) ---
            ...healthPaths,

            // --- Users (modular) ---
            ...usersPaths,

            // --- UserDetails (modular) ---
            ...userDetailsPaths,
        },

        components: {
            schemas: {
                // Common error
                Error: {
                    type: 'object',
                    properties: { error: { type: 'string' } },
                    example: { error: 'Something went wrong' },
                },

                // Health (modular)
                ...healthSchemas,

                // Users (modular)
                ...usersSchemas,

                // UserDetails (modular)
                ...userDetailsSchemas,
            },
        },
    };

    return spec;
}
