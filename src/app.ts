// src/app.ts
import 'dotenv/config';

import express from 'express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import routes from './routes/index.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

import { ensureUsersTable } from './config/dynamo-admin.js';
import { DDB_USERS_TABLE } from './config/dynamo.js';

import authRoutes from './routes/auth.routes.js';

import { buildOpenAPISpec } from './docs/openapi.js';
import { registerSwaggerDocs } from './docs/components/swagger.js';

const app = express();
app.use(express.json());

// Ensure DynamoDB users table (dev only)
if (env.NODE_ENV !== 'production') {
    await ensureUsersTable(DDB_USERS_TABLE);
}

// Health endpoint
app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));

// Swagger UI
const spec = buildOpenAPISpec(`http://localhost:${env.PORT}`);
registerSwaggerDocs(app, spec, {
    path: '/docs',
    theme: 'dracula',
    title: 'My API — Docs',
});

// JWT auth endpoints
app.use('/api/auth', authRoutes);

// API routes
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
