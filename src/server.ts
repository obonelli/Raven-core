// src/server.ts
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const port = Number(env.PORT ?? process.env.PORT ?? 3000);

// --- Trust Proxy seguro ---
const TRUST_PROXY = (process.env.TRUST_PROXY ?? '').trim();

// Número explícito o cadena de nombres conocidos
if (TRUST_PROXY) {
    app.set(
        'trust proxy',
        /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY
    );
} else {
    // Por defecto: en prod confía en 1 salto (ej. Nginx/Render),
    // en dev no confíes en nadie
    app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : 0);
}

// --- Listen on 0.0.0.0 (needed for Render) ---
const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`API listening on http://localhost:${port}`);
});

// --- Dev-only: test Redis wire connection una sola vez ---
if (env.NODE_ENV !== 'production') {
    import('./debug/redis-wire-check.js')
        .then(m => m.testRedisWireOnce())
        .catch(err => logger.warn('[debug] redis-wire-check skipped', err));
}

// --- Graceful shutdown (Render rollouts send SIGTERM) ---
const shutDown = (signal: string) => {
    logger.info(`${signal} received. Shutting down...`);
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutDown('SIGTERM'));
process.on('SIGINT', () => shutDown('SIGINT'));
