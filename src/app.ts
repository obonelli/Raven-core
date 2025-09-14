import 'dotenv/config';

import express from 'express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import routes from './routes/index.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

import swaggerUi from 'swagger-ui-express';
import { buildOpenAPISpec } from './docs/openapi.js';
import { SwaggerTheme } from 'swagger-themes';
import type { SwaggerThemeName } from 'swagger-themes';

// ✅ ADD THESE TWO LINES
import { ensureUsersTable } from './config/dynamo-admin.js';
import { DDB_USERS_TABLE } from './config/dynamo.js';

// ✅ NEW: auth routes
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(express.json());

// ✅ One-time ensure (skip in prod)
if (env.NODE_ENV !== 'production') {
    // Top-level await (or use the void pattern if you prefer non-blocking)
    await ensureUsersTable(DDB_USERS_TABLE);
    // or: void ensureUsersTable(DDB_USERS_TABLE).catch(console.error);
}

// Health
app.get('/health', (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));

// Swagger UI + dark theme (dracula)
const spec = buildOpenAPISpec(`http://localhost:${env.PORT}`);
const theme = new SwaggerTheme();
const themeName = 'dracula' as SwaggerThemeName;

app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
        explorer: true,
        customCss: theme.getBuffer(themeName),
        customSiteTitle: 'My API — Docs',
        swaggerOptions: { persistAuthorization: true },
    })
);

app.get('/api-docs.json', (_req, res) => res.json(spec));

// ✅ NEW: mount JWT auth endpoints
app.use('/api/auth', authRoutes);

// Existing API routes
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
