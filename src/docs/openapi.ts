// src/docs/openapi.ts
// Minimal OpenAPI 3.0 spec, modular by controller

import { usersPaths } from './paths/users';
import { usersSchemas } from './components/users.schemas';

import { userDetailsPaths } from './paths/userDetails';
import { userDetailsSchemas } from './components/userDetails.schemas';

import { healthPaths } from './paths/health';
import { healthSchemas } from './components/health.schemas';

import { authPaths } from './paths/auth';
import { authSchemas } from './components/auth.schemas';

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
            { name: 'Auth', description: 'JWT authentication (login/refresh/logout/me)' },
            { name: 'Users', description: 'User CRUD' },
            { name: 'UserDetails', description: 'Additional details for a user (MySQL)' },
        ],
        paths: {
            // --- Health (modular) ---
            ...healthPaths,

            // --- Auth (modular) ---
            ...authPaths,

            // --- Users (modular) ---
            ...usersPaths,

            // --- UserDetails (modular) ---
            ...userDetailsPaths,
        },

        components: {
            // 👇 add securitySchemes here
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Paste your access token here (without quotes)',
                },
            },
            schemas: {
                // Common error
                Error: {
                    type: 'object',
                    properties: { error: { type: 'string' } },
                    example: { error: 'Something went wrong' },
                },

                // Health (modular)
                ...healthSchemas,

                // Auth (modular)
                ...authSchemas,

                // Users (modular)
                ...usersSchemas,

                // UserDetails (modular)
                ...userDetailsSchemas,
            },
        },
    };

    return spec;
}
