import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

/**
 * Validates only req.body against a Zod schema.
 * On failure → 400 with error.flatten().
 * On success → replaces req.body with parsed data.
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

        req.body = parsed.data; // sanitized & typed
        next();
    };
}
