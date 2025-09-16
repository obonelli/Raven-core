// Prometheus metrics (HTTP duration + default Node process metrics)
import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

const register = new client.Registry();

// Collect default process metrics with a prefix to avoid collisions
client.collectDefaultMetrics({ register, prefix: 'raven_core_' });

// Histogram for HTTP request duration
export const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration (seconds)',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});
register.registerMetric(httpDuration);

// Middleware to time requests
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const end = httpDuration.startTimer({ method: req.method.toLowerCase() });
    res.on('finish', () => {
        const route = (req.route?.path || req.path || 'unknown').replace(/\/\d+/g, '/:id');
        end({ route, status: String(res.statusCode) });
    });
    next();
}

// /metrics endpoint handler
export async function metricsHandler(_req: Request, res: Response) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}
