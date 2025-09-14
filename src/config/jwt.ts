import 'dotenv/config';
import * as jose from 'jose';

const JWT_SECRET = (process.env.JWT_SECRET ?? '').trim();
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET');
const SECRET = new TextEncoder().encode(JWT_SECRET);

export const JWT_ISSUER = (process.env.JWT_ISSUER ?? 'myapi').trim();
export const JWT_AUDIENCE = (process.env.JWT_AUDIENCE ?? 'myapi-clients').trim();

// Defaults (tweak via env if you want)
export const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES ?? '15m';
export const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES ?? '7d';

type BasePayload = {
    sub: string;              // user id
    email?: string;
    role?: string;
};

export async function signAccessToken(payload: BasePayload) {
    const now = Math.floor(Date.now() / 1000);
    return await new jose.SignJWT({ ...payload, typ: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(now)
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setExpirationTime(ACCESS_EXPIRES_IN)
        .sign(SECRET);
}

export async function signRefreshToken(payload: BasePayload & { jti: string }) {
    const now = Math.floor(Date.now() / 1000);
    return await new jose.SignJWT({ ...payload, typ: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(now)
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setExpirationTime(REFRESH_EXPIRES_IN)
        .sign(SECRET);
}

export async function verifyJWT<T = unknown>(token: string) {
    const { payload } = await jose.jwtVerify(token, SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
    return payload as T & BasePayload & { typ?: 'access' | 'refresh'; jti?: string };
}
