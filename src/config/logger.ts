// src/config/logger.ts
import pino from 'pino';
import { env } from './env.js';

export const logger = pino(
    env.isProd
        ? {
            level: 'info',
        }
        : {
            level: 'debug',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                },
            },
        }
);
