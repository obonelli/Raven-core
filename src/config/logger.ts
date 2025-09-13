// src/config/logger.ts
import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
    level: env.isProd ? 'info' : 'debug',
    ...(env.isProd
        ? {}
        : {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                },
            },
        }),
});
