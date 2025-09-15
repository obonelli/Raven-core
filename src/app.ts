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

// Quick test endpoint for Vercel
app.get('/api/ping', (_req, res) => {
    res.json({ ok: true, message: 'pong 🏓' });
});

// Base URL for Swagger: if running on Vercel, use its domain; otherwise use localhost
const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${env.PORT}`;

const spec = buildOpenAPISpec(vercelUrl);

// Exponer el JSON de la especificación (útil si el UI lo necesita o para debug)
app.get('/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

// Mount Swagger UI (path /docs)
// Mantén Dracula en dev, evita tema en prod (en Vercel) para no romper la UI
const swaggerOpts: { path: string; title: string; theme?: string } = {
    path: '/docs',
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
};
registerSwaggerDocs(app, spec, swaggerOpts);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Error middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
