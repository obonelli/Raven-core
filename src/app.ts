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

// Quick test endpoint
app.get('/api/ping', (_req, res) => {
    res.json({ ok: true, message: 'pong 🏓' });
});

// Base URL for Swagger
const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${env.PORT}`;
const apiBase = process.env.VERCEL_URL ? `${origin}/api` : origin;

// Build spec with correct server URL
const spec = buildOpenAPISpec(apiBase);

// Rutas de Swagger dependen del entorno
const docsPath = process.env.VERCEL_URL ? '/api/docs' : '/docs';
const docsJsonPath = process.env.VERCEL_URL ? '/api/docs.json' : '/docs.json';

// JSON spec
app.get(docsJsonPath, (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

// UI
const swaggerOpts: { path: string; title: string; theme?: string } = {
    path: docsPath,
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
};
registerSwaggerDocs(app, spec, swaggerOpts);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Errors
app.use(notFound);
app.use(errorHandler);

export default app;
