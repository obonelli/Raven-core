// api/docs/[[...slug]].ts
import express from 'express';
import { buildOpenAPISpec } from '../../src/docs/openapi.js';
import { registerSwaggerDocs } from '../../src/docs/components/swagger.js';
import { env } from '../../src/config/env.js';

const app = express();

// Base URL de la API (siempre termina en /api)
const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${env.PORT}`;
const apiBase = `${origin}/api`;

// Spec
const spec = buildOpenAPISpec(apiBase);

// JSON en /api/docs/docs.json
app.get('/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

// UI en la RAÍZ de la lambda → /api/docs/ y sus assets /api/docs/*
registerSwaggerDocs(app, spec, {
    path: '/', // IMPORTANTÍSIMO: raíz del handler
    title: 'My API — Docs',
    ...(env.NODE_ENV !== 'production' ? { theme: 'dracula' } : {}),
});

export default app;
