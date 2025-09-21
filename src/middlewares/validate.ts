// src/middlewares/validate.ts
import type { RequestHandler } from 'express';
import type { ZodTypeAny, ZodObject, ZodRawShape } from 'zod';
import type { ParsedQs } from 'qs';

// Generic dictionary for parameters
type ParamsDict = Record<string, string>;

export function validateBody(schema: ZodTypeAny): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'ValidationError',
                details: parsed.error.flatten(),
            });
        }
        req.body = parsed.data as unknown;
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
        req.params = parsed.data as ParamsDict;
        next();
    };
}

/**
 * Valida únicamente req.query contra un Zod schema.
 * Guarda el resultado en res.locals.validatedQuery y además
 * asigna req.query (cast) para que controladores existentes puedan leerlo.
 */
export function validateQuery(
    schema: ZodObject<ZodRawShape> | ZodTypeAny
): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'ValidationError',
                details: parsed.error.flatten(),
            });
        }
        (res.locals as Record<string, unknown>).validatedQuery = parsed.data;
        // Compatibilidad con controladores que leen req.query
        req.query = parsed.data as unknown as ParsedQs;
        next();
    };
}

/**
 * Validador combinado para body/params/query cuando defines un schema
 * con shape { body, params, query }.
 */
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
            params?: ParamsDict;
            query?: unknown;
        };

        if (data.body !== undefined) req.body = data.body as unknown;
        if (data.params !== undefined) req.params = data.params;
        if (data.query !== undefined) {
            (res.locals as Record<string, unknown>).validatedQuery = data.query;
            req.query = data.query as unknown as ParsedQs;
        }

        next();
    };
}
