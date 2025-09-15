import 'dotenv/config';

import express from 'express';
import { env } from './config/env.js';
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

// Solo en local
if (env.NODE_ENV !== 'production') {
    await ensureUsersTable(DDB_USERS_TABLE);
}

// Health + Ping
app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));
app.get('/api/ping', (_req, res) => res.json({ ok: true, message: 'pong 🏓' }));

// Base URL para spec
const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${env.PORT}`;
const apiBase = `${origin}/api`;

// OpenAPI spec
const spec = buildOpenAPISpec(apiBase);

// JSON del spec en /api/docs.json
app.get('/api/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

// Swagger UI en /api/docs
registerSwaggerDocs(app, spec, {
    path: '/api/docs',
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Middlewares de error
app.use(notFound);
app.use(errorHandler);

export default app;
