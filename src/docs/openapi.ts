// Minimal OpenAPI 3.0 spec, modular by controller

import { usersPaths } from './paths/users.js';
import { usersSchemas } from './components/users.schemas.js';

import { userDetailsPaths } from './paths/userDetails.js';
import { userDetailsSchemas } from './components/userDetails.schemas.js';

import { healthPaths } from './paths/health.js';
import { healthSchemas } from './components/health.schemas.js';

import { authPaths } from './paths/auth.js';
import { authSchemas } from './components/auth.schemas.js';

export function buildOpenAPISpec() {
    const spec = {
        openapi: '3.0.3',
        info: {
            title: 'My API',
            version: '1.0.0',
            description: 'Express + TypeScript API (MVC)',
        },
        servers: [
            {
                url: '/',
                description: 'Base URL (paths already include /api)',
            },
        ],
        tags: [
            { name: 'Health', description: 'Service health checks' },
            { name: 'Auth', description: 'JWT authentication (login/refresh/logout/me)' },
            { name: 'Users', description: 'User CRUD' },
            { name: 'UserDetails', description: 'Additional details for a user (MySQL)' },
        ],
        paths: {
            ...healthPaths,
            ...authPaths,
            ...usersPaths,
            ...userDetailsPaths,
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Paste your access token here (without quotes)',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: { error: { type: 'string' } },
                    example: { error: 'Something went wrong' },
                },
                ...healthSchemas,
                ...authSchemas,
                ...usersSchemas,
                ...userDetailsSchemas,
            },
        },
    };

    return spec;
}
