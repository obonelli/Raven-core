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
