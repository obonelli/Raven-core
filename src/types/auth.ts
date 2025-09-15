// src/types/auth.ts
export type AuthUser = {
    sub: string;
    email?: string;
    role?: string;
};

export type DBUser = import('../models/user.model.js').User;

export type RequestUser = AuthUser | DBUser;
