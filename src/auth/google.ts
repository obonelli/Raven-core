// src/auth/google.ts
import type { Express, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import crypto from 'crypto';
import { upsertGoogleUser } from '../repositories/user.dynamo.repo.js';
import { signAccessToken, signRefreshToken, REFRESH_EXPIRES_IN } from '../config/jwt.js';
import { buildCacheKey, rSet, REDIS_TTL } from '../config/redis.js';

const {
    NODE_ENV,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    FRONT_CALLBACK_URL,
    FRONT_CALLBACK_URL_DEV,
    FRONT_CALLBACK_URL_PROD,
} = process.env;

const isTest = NODE_ENV === 'test';
const isProd = NODE_ENV === 'production';

// Front callback final (elige por entorno; permite override con FRONT_CALLBACK_URL)
const FRONT_CB =
    FRONT_CALLBACK_URL ??
    (isProd ? FRONT_CALLBACK_URL_PROD : FRONT_CALLBACK_URL_DEV);

function toSeconds(span: string): number {
    const m = /^(\d+)([smhdw])$/.exec(span || '');
    if (!m) return 60 * 60 * 24 * 7;
    const n = Number(m[1]); const u = m[2];
    return u === 's' ? n : u === 'm' ? n * 60 : u === 'h' ? n * 3600 : u === 'd' ? n * 86400 : n * 604800;
}
const REFRESH_TTL_SEC = toSeconds(REFRESH_EXPIRES_IN as string);
const refreshTokenKey = (userId: string, jti: string) => buildCacheKey('rt', userId, jti);

export function mountGoogleAuth(app: Express) {
    const hasCreds = !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET;
    if (isTest || !hasCreds) return;

    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_CLIENT_ID!,
                clientSecret: GOOGLE_CLIENT_SECRET!,
                // Debe coincidir con lo registrado en Google Cloud Console
                callbackURL: GOOGLE_CALLBACK_URL || '/auth/google/callback',
            },
            async (_at, _rt, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    const name = profile.displayName || 'User';
                    if (!email) return done(new Error('Google returned no email'));
                    const user = await upsertGoogleUser({ email, name, googleId: profile.id });
                    done(null, user);
                } catch (e) {
                    done(e as Error);
                }
            }
        )
    );

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get(
        '/auth/google/callback',
        passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
        async (req: Request, res: Response) => {
            const u = req.user as { userId: string; email?: string; role?: string };

            const base = {
                sub: String(u.userId),
                ...(u.email ? { email: u.email } : {}),
                ...(u.role ? { role: u.role } : {}),
            };

            const jti = crypto.randomUUID();
            const accessToken = await signAccessToken(base);
            const refreshToken = await signRefreshToken({ ...base, jti });

            await rSet(
                refreshTokenKey(String(u.userId), jti),
                true,
                Math.max(REFRESH_TTL_SEC, REDIS_TTL)
            );

            if (!FRONT_CB) {
                return res.json({
                    user: { id: u.userId, email: u.email, role: u.role },
                    accessToken,
                    refreshToken,
                });
            }

            const url = new URL(FRONT_CB);
            const hash = new URLSearchParams({ access: accessToken, refresh: refreshToken }).toString();
            return res.redirect(`${url.toString()}#${hash}`);
        }
    );

    app.get('/auth/failure', (_req, res) => res.status(401).json({ error: 'GoogleAuthFailed' }));
}
