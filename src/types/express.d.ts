// src/types/express.d.ts
import type { RequestUser } from './auth';

declare global {
    namespace Express {
        interface Request {
            user?: RequestUser;
            token?: string;
        }
    }
}

export { };
