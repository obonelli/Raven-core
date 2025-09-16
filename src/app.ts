import 'dotenv/config';

import express, { type Express } from 'express';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { ensureUsersTable } from './config/dynamo-admin.js';
import { DDB_USERS_TABLE } from './config/dynamo.js';
import authRoutes from './routes/auth.routes.js';
import { buildOpenAPISpec } from './docs/openapi.js';
import { registerSwaggerDocs } from './docs/components/swagger.js';

// Monitoring
import { initSentry, Sentry } from './config/sentry.js';
import { metricsMiddleware, metricsHandler } from './monitoring/metrics.js';

const app: Express = express();

// Sentry must be initialized before route handling
initSentry('raven-core');
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
}

// Behind proxy (corrects req.protocol, HTTPS, etc.)
app.set('trust proxy', true);

// JSON body parsing
app.use(express.json());

// Dev-only: ensure DynamoDB table without blocking startup
if (env.NODE_ENV !== 'production') {
    (async () => {
        try {
            await ensureUsersTable(DDB_USERS_TABLE);
        } catch {
            /* no-op in dev/test */
        }
    })();
}

// Health endpoints
app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));
app.get('/api/ping', (_req, res) => res.json({ ok: true, message: 'pong 🏓' }));

// Prometheus metrics
if (process.env.METRICS_ENABLED === 'true') {
    app.use(metricsMiddleware);
    app.get('/metrics', metricsHandler);
}

// OpenAPI spec + Swagger UI
const spec = buildOpenAPISpec();
app.get('/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});
registerSwaggerDocs(app, spec, {
    path: '/docs',
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
});

// Redirect root to docs
app.get('/', (_req, res) => res.redirect('/docs'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Sentry error handler before custom handler
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}

// Custom error handler
app.use(errorHandler);

export default app;
