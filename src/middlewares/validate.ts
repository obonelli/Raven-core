// src/middlewares/validate.ts
import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export function validate(schema: ZodType<unknown>): RequestHandler {
    return (req, res, next) => {
        const parsed = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!parsed.success) {
            return res
                .status(400)
                .json({ error: 'ValidationError', details: parsed.error.flatten() });
        }

        next();
    };
}
