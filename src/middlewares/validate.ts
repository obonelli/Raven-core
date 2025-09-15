// src/middlewares/validate.ts
import type { RequestHandler } from 'express';
import type { ZodTypeAny, ZodObject, ZodRawShape } from 'zod';

export function validateBody(schema: ZodTypeAny): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'ValidationError',
                details: parsed.error.flatten(),
            });
        }
        req.body = parsed.data;
        next();
    };
}

export function validateParams(schema: ZodObject<ZodRawShape>): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'ValidationError',
                details: parsed.error.flatten(),
            });
        }
        req.params = parsed.data as import('express-serve-static-core').ParamsDictionary;
        next();
    };
}

export function validate(schema: ZodObject<ZodRawShape>): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!parsed.success) {
            return res.status(400).json({
                error: 'ValidationError',
                details: parsed.error.flatten(),
            });
        }

        const data = parsed.data as {
            body?: unknown;
            params?: import('express-serve-static-core').ParamsDictionary;
            query?: unknown;
        };

        if (data.body !== undefined) req.body = data.body as unknown;
        if (data.params !== undefined) req.params = data.params;
        if (data.query !== undefined) {
            (res.locals as Record<string, unknown>).validatedQuery = data.query;
        }

        next();
    };
}
