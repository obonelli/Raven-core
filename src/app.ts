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

if (env.NODE_ENV !== 'production') {
    await ensureUsersTable(DDB_USERS_TABLE);
}

app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));
app.get('/api/ping', (_req, res) => res.json({ ok: true, message: 'pong 🏓' }));

// Base URL para spec (siempre /api)
const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${env.PORT}`;
const apiBase = `${origin}/api`;

// Build spec
const spec = buildOpenAPISpec(apiBase);

// Swagger en /docs y /docs.json (fuera de /api → funciona en Vercel)
app.get('/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

registerSwaggerDocs(app, spec, {
    path: '/docs',
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Errores
app.use(notFound);
app.use(errorHandler);

export default app;
