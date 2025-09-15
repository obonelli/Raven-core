// api/docs.ts  → Lambda dedicada para Swagger en Vercel
import express from 'express';

import { buildOpenAPISpec } from '../src/docs/openapi.js';
import { registerSwaggerDocs } from '../src/docs/components/swagger.js';
import { env } from '../src/config/env.js';

const app = express();

// URL base para el server de la API (siempre con /api)
const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${env.PORT}`;
const apiBase = `${origin}/api`;

// Construir spec
const spec = buildOpenAPISpec(apiBase);

// Exponer JSON en /docs.json dentro de esta lambda (/api/docs/docs.json)
app.get('/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

// ⚠️ Montar UI en raíz de la lambda → /api/docs/
registerSwaggerDocs(app, spec, {
    path: '/',                // importante: raíz de la lambda
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
});

export default app;
