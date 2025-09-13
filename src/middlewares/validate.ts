// src/middlewares/validate.ts
import type { RequestHandler } from "express";
import type { ZodTypeAny, ZodObject, ZodRawShape } from "zod";

/**
 * Validate only req.body against schema.
 */
export function validateBody(schema: ZodTypeAny): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "ValidationError",
                details: parsed.error.flatten(),
            });
        }
        req.body = parsed.data;
        next();
    };
}

/**
 * Validate req.params against schema.
 */
export function validateParams(schema: ZodObject<ZodRawShape>): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({
                error: "ValidationError",
                details: parsed.error.flatten(),
            });
        }
        req.params = parsed.data as import("express-serve-static-core").ParamsDictionary;
        next();
    };
}

/**
 * Combined validator for { body, params, query }.
 * NOTE: In Express 5 you cannot reassign req.query (it's a getter).
 * We put validated query into res.locals.validatedQuery instead.
 */
export function validate(schema: ZodObject<any>): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!parsed.success) {
            return res.status(400).json({
                error: "ValidationError",
                details: parsed.error.flatten(),
            });
        }

        if (parsed.data?.body !== undefined) req.body = parsed.data.body;
        if (parsed.data?.params !== undefined) {
            req.params = parsed.data.params as import("express-serve-static-core").ParamsDictionary;
        }
        if (parsed.data?.query !== undefined) {
            // Do not reassign req.query in Express 5
            res.locals.validatedQuery = parsed.data.query;
        }

        next();
    };
}
