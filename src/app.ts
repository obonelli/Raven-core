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

// Render is behind a proxy (ensures correct req.protocol, HTTPS, etc.)
app.set('trust proxy', true);

// Parse JSON requests
app.use(express.json());

// Only in local/dev environments
if (env.NODE_ENV !== 'production') {
    (async () => {
        try {
            await ensureUsersTable(DDB_USERS_TABLE);
        } catch {
            // optionally log, but don't block app start in dev/tests
        }
    })();
}

// Health check and ping endpoints
app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));
app.get('/api/ping', (_req, res) => res.json({ ok: true, message: 'pong 🏓' }));

// OpenAPI: relative base path (works both locally and on Render)
const spec = buildOpenAPISpec();

// Expose OpenAPI spec as JSON
app.get('/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

// Swagger UI available at /docs
registerSwaggerDocs(app, spec, {
    path: '/docs',
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
});

// Shortcut: redirect root to docs
app.get('/', (_req, res) => res.redirect('/docs'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Error middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
