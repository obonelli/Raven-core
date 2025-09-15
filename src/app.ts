import 'dotenv/config';

import express from 'express';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

// Dev-only: ensure DynamoDB users table (local only)
import { ensureUsersTable } from './config/dynamo-admin.js';
import { DDB_USERS_TABLE } from './config/dynamo.js';

// Auth
import authRoutes from './routes/auth.routes.js';

// Swagger
import { buildOpenAPISpec } from './docs/openapi.js';
import { registerSwaggerDocs } from './docs/components/swagger.js';

const app = express();
app.use(express.json());

// Only in development/local (Vercel uses NODE_ENV=production)
if (env.NODE_ENV !== 'production') {
    await ensureUsersTable(DDB_USERS_TABLE);
}

// Health endpoint
app.get('/health', (_req, res) => {
    res.json({ ok: true, env: env.NODE_ENV });
});

// Base URL for Swagger: if running on Vercel, use its domain; otherwise use localhost
const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${env.PORT}`;
const spec = buildOpenAPISpec(vercelUrl);

// Mount Swagger UI (path /docs)
registerSwaggerDocs(app, spec, {
    path: '/docs',
    theme: 'dracula',
    title: 'My API — Docs',
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Error middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
