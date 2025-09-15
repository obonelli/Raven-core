// api/docs/[[...slug]].ts
import express from 'express';
import { buildOpenAPISpec } from '../../src/docs/openapi.js';
import { env } from '../../src/config/env.js';

const app = express();

// Base URL de la API (siempre termina en /api)
const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${env.PORT}`;
const apiBase = `${origin}/api`;

// Construir spec
const spec = buildOpenAPISpec(apiBase);

// JSON en /api/docs/docs.json
app.get('/docs.json', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(spec);
});

// HTML con Swagger UI desde CDN (sin servir assets locales)
app.get(['/', '/index.html'], (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My API — Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>body { margin: 0; } #swagger-ui { min-height: 100vh; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: './docs.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      deepLinking: true
    });
  </script>
</body>
</html>`);
});

export default app;
