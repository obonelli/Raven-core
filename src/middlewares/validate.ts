// src/middlewares/validate.ts
import type { RequestHandler } from "express";
import type { ZodTypeAny, ZodObject, ZodRawShape } from "zod";

/**
 * Valida solo req.body contra un schema de body (zod).
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
 * Valida req.params contra un schema de params (zod).
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
 * Validador "combinado" para schemas con { body, params, query }.
 * Útil si tus schemas están definidos como:
 *   z.object({ body: z.object(...), params: z.object(...), query: z.object(...) })
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

        // Sobrescribimos con los datos parseados (ya saneados)
        if (parsed.data?.body !== undefined) req.body = parsed.data.body;
        if (parsed.data?.params !== undefined)
            req.params = parsed.data.params as import("express-serve-static-core").ParamsDictionary;
        if (parsed.data?.query !== undefined)
            req.query = parsed.data.query as any;

        next();
    };
}
