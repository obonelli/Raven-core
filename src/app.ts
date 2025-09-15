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

// Render está detrás de proxy (https correcto en req.protocol, etc.)
app.set('trust proxy', true);

// JSON
app.use(express.json());

// Solo en local/dev
if (env.NODE_ENV !== 'production') {
    await ensureUsersTable(DDB_USERS_TABLE);
}

// Health + Ping
app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));
app.get('/api/ping', (_req, res) => res.json({ ok: true, message: 'pong 🏓' }));

// OpenAPI: base relativa para que funcione igual en Render y local
const apiBase = '/api';
const spec = buildOpenAPISpec();

// Docs JSON
app.get('/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

// Swagger UI en /docs
registerSwaggerDocs(app, spec, {
    path: '/docs',
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
});

// Atajo: abrir docs en raíz
app.get('/', (_req, res) => res.redirect('/docs'));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Middlewares de error
app.use(notFound);
app.use(errorHandler);

export default app;
