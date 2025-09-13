// src/app.ts
import 'dotenv/config'; // <— carga .env primero

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

const app = express();
app.use(express.json());

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

// Raw JSON spec
app.get('/api-docs.json', (_req, res) => res.json(spec));

// API routes
app.use('/api', routes);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

export default app;
