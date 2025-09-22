// src/middlewares/metaSignature.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const APP_SECRET = (process.env.WHATSAPP_APP_SECRET || '').trim();

type RawBodyRequest = Request & { rawBody?: Buffer };

export function verifyMetaSignature(req: Request, res: Response, next: NextFunction) {
    if (!APP_SECRET) return next(); // si no tienes secret, omite (modo dev)

    try {
        const raw = (req as RawBodyRequest).rawBody;
        const header = req.header('x-hub-signature-256') || '';

        if (!raw || !header.startsWith('sha256=')) {
            return res.sendStatus(401);
        }

        const expected =
            'sha256=' +
            crypto.createHmac('sha256', APP_SECRET).update(raw).digest('hex');

        if (
            crypto.timingSafeEqual(
                Buffer.from(header),
                Buffer.from(expected)
            )
        ) {
            return next();
        }

        return res.sendStatus(401);
    } catch {
        return res.sendStatus(401);
    }
}
