// src/services/user.service.ts
import * as repo from "../repositories/user.dynamo.repo.js";
import type { User } from "../models/user.model.js";
import type { CreateUserDto, UpdateUserDto } from "../schemas/user.schema.js";
import { getJSON, setJSON, delKey } from "../lib/cache.js";
import { buildCacheKey } from "../config/redis.js";

function emailTakenError(email: string) {
    const err = Object.assign(new Error(`Email already in use: ${email}`), {
        status: 409,
        code: "EmailTaken",
    });
    return err;
}

export async function listUsers(limit = 100): Promise<User[]> {
    const cacheKey = buildCacheKey("users", `limit:${limit}`);
    const cached = await getJSON<User[]>(cacheKey);
    if (cached) return cached;

    const fresh = await repo.list(limit);
    await setJSON(cacheKey, fresh);
    return fresh;
}

export async function getUser(id: string): Promise<User | null> {
    const cacheKey = buildCacheKey("user", id);
    const cached = await getJSON<User>(cacheKey);
    if (cached) return cached;

    const fresh = await repo.getById(id);
    if (fresh) await setJSON(cacheKey, fresh);
    return fresh;
}

export async function createUser(dto: CreateUserDto): Promise<User> {
    // Ensure unique email via GSI
    const matches = await repo.findByEmail(dto.email);
    if (matches.length > 0) {
        throw emailTakenError(dto.email);
    }

    const created = await repo.create(dto);
    await setJSON(buildCacheKey("user", created.userId), created);
    // Invalidate common list cache
    await delKey(buildCacheKey("users", "limit:100"));
    return created;
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    // If email changes, ensure uniqueness
    if (dto.email !== undefined) {
        const matches = await repo.findByEmail(dto.email);
        const someoneElse = matches.find(u => u.userId !== id);
        if (someoneElse) {
            throw emailTakenError(dto.email);
        }
    }

    const payload: { name?: string; email?: string } = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.email !== undefined) payload.email = dto.email;

    const updated = await repo.update(id, payload);
    await setJSON(buildCacheKey("user", id), updated);
    return updated;
}

export async function deleteUser(id: string): Promise<void> {
    await repo.remove(id);
    await delKey(buildCacheKey("user", id));
}
