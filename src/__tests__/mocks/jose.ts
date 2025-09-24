// Mock mínimo de `jose` para tests
export class SignJWT {
    constructor(_payload: unknown) { }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setIssuer() { return this; }
    setAudience() { return this; }
    setSubject() { return this; }
    setExpirationTime() { return this; }
    async sign() { return 'fake.jwt.token'; }
}

export async function jwtVerify(_token: string, _secret: unknown, _opts?: unknown) {
    return { payload: { sub: 'test-user' } };
}
