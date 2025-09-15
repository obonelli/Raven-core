import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const port = Number(env.PORT ?? process.env.PORT ?? 3000);

// Listen on 0.0.0.0 (needed for Render)
const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`API listening on http://localhost:${port}`);
});

// Graceful shutdown (Render rollouts send SIGTERM)
const shutDown = (signal: string) => {
    logger.info(`${signal} received. Shutting down...`);
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutDown('SIGTERM'));
process.on('SIGINT', () => shutDown('SIGINT'));
