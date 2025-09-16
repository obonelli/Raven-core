// src/middlewares/security.ts
import type { Express, Request } from 'express';
import helmet from 'helmet';
import cors, { CorsOptionsDelegate } from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { security } from '../config/security.js';

export function applySecurity(app: Express) {
    // ---- Helmet ----
    if (security.helmet.enableCsp) {
        app.use(
            helmet({
                contentSecurityPolicy: {
                    useDefaults: true,
                    directives: {
                        // Adjust if you use Swagger, Grafana, Sentry, etc.
                        'img-src': ["'self'", 'data:', 'blob:'],
                        'script-src': ["'self'"],
                        'connect-src': ["'self'"],
                        'style-src': ["'self'", "'unsafe-inline'"],
                    },
                },
                crossOriginEmbedderPolicy: false, // Swagger UI may need this off
            })
        );
    } else {
        // In dev, disable CSP to avoid breaking HMR/Swagger
        app.use(
            helmet({
                contentSecurityPolicy: false,
                crossOriginEmbedderPolicy: false,
            })
        );
    }

    // ---- CORS allowlist (dynamic whitelist) ----
    const allowlist = security.cors.allowedOrigins;

    const corsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
        const origin = req.header('Origin') || '';

        // Safely parse hostname (malformed Origin must not crash)
        let hostname = '';
        try {
            hostname = origin ? new URL(origin).hostname : '';
        } catch {
            hostname = '';
        }

        const isAllowed =
            !origin || // allow non-browser tools
            allowlist.includes(origin) ||
            /https?:\/\/localhost:\d+/.test(origin) ||
            /https?:\/\/127\.0\.0\.1:\d+/.test(origin) ||
            // Common preview domains; adjust as needed
            /\.vercel\.app$/.test(hostname) ||
            /\.onrender\.com$/.test(hostname);

        callback(null, {
            origin: isAllowed,
            credentials: security.cors.allowCredentials,
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
            ],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            exposedHeaders: security.cors.exposedHeaders,
            maxAge: 86400,
        });
    };

    // Handles both simple CORS and preflights (OPTIONS) globally in Express 5
    app.use(cors(corsDelegate));

    // ---- Global API rate limit ----
    const apiLimiter = rateLimit({
        windowMs: security.rateLimit.windowMs,
        max: security.rateLimit.max,
        standardHeaders: security.rateLimit.standardHeaders,
        legacyHeaders: security.rateLimit.legacyHeaders,
        message: {
            error: 'TooManyRequests',
            message: 'Too many requests, please try again later.',
        },
    });
    app.use('/api', apiLimiter);

    // ---- Slowdown middleware (protects against scraping/abuse) ----
    // Old behavior: delay increases linearly after `delayAfter`
    const apiBrake = slowDown({
        windowMs: security.slowDown.windowMs,
        delayAfter: security.slowDown.delayAfter,
        delayMs: (used) => {
            const over = Math.max(0, used - security.slowDown.delayAfter);
            return over * security.slowDown.delayMs;
        },
        // Silence the v2+ migration hint since we're intentionally using the old behavior
        validate: { delayMs: false },
    });
    app.use('/api', apiBrake);
}

// Specific limiter for Auth routes, mounted before /api/auth
export const authLimiter = rateLimit({
    windowMs: security.authLimit.windowMs,
    max: security.authLimit.max,
    standardHeaders: security.authLimit.standardHeaders,
    legacyHeaders: security.authLimit.legacyHeaders,
    message: {
        error: 'TooManyAuthAttempts',
        message: 'Too many auth attempts, please try again later.',
    },
});
