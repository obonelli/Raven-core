// src/config/security.ts
import 'dotenv/config';

function parseBool(v: string | undefined, def = false) {
    if (v == null) return def;
    return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

// Comma-separated origins from environment variable
const rawOrigins = process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://localhost:5173';

export const security = {
    cors: {
        // Example: "https://app.example.com,https://admin.example.com,http://localhost:5173"
        allowedOrigins: rawOrigins.split(',').map(s => s.trim()).filter(Boolean),
        allowCredentials: parseBool(process.env.CORS_CREDENTIALS, true),
        // Extra headers to expose to the client
        exposedHeaders: (process.env.CORS_EXPOSED_HEADERS ?? 'X-Request-Id')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
    },

    rateLimit: {
        // General API rate limiter
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000), // 15 minutes
        max: Number(process.env.RATE_LIMIT_MAX ?? 300), // max requests per window
        standardHeaders: true, // use standard RateLimit-* headers
        legacyHeaders: false,
    },

    authLimit: {
        // Specific limiter for /api/auth/*
        windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000), // 10 minutes
        max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
        standardHeaders: true,
        legacyHeaders: false,
    },

    slowDown: {
        // Slow down middleware for sensitive endpoints
        windowMs: Number(process.env.SLOWDOWN_WINDOW_MS ?? 10 * 60 * 1000), // 10 minutes
        delayAfter: Number(process.env.SLOWDOWN_DELAY_AFTER ?? 50), // start delaying after N requests
        delayMs: Number(process.env.SLOWDOWN_DELAY_MS ?? 250), // delay in ms per request
    },

    helmet: {
        // Enable strong CSP in production; in dev disable CSP to avoid breaking Swagger/HMR
        enableCsp: (process.env.NODE_ENV ?? 'development') === 'production',
    },
};
