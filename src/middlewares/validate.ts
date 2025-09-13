import type { RequestHandler } from 'express';
import type { ZodObject, ZodRawShape } from 'zod';

export function validate(schema: ZodObject<ZodRawShape>): RequestHandler {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            return res.status(400).json({
                error: 'ValidationError',
                details: result.error.flatten(),
            });
        }

        const { body, params, query } = result.data as {
            body: typeof req.body;
            params: typeof req.params;
            query: typeof req.query;
        };

        req.body = body;
        req.params = params;
        req.query = query;

        next();
    };
}
