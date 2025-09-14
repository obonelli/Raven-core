import * as repo from "../repositories/user.dynamo.repo.js";
import type { User } from "../models/user.model.js";
import type { CreateUserDto, UpdateUserDto } from "../schemas/user.schema.js";
import { getJSON, setJSON, delKey } from "../lib/cache.js";
import { k } from "../config/redis.js";

export async function listUsers(limit = 100): Promise<User[]> {
    const key = k("users", `limit:${limit}`);
    const cached = await getJSON<User[]>(key);
    if (cached) return cached;

    const fresh = await repo.list(limit);
    await setJSON(key, fresh);
    return fresh;
}

export async function getUser(id: string): Promise<User | null> {
    const key = k("user", id);
    const cached = await getJSON<User>(key);
    if (cached) return cached;

    const fresh = await repo.getById(id);
    if (fresh) await setJSON(key, fresh);
    return fresh;
}

export async function createUser(dto: CreateUserDto): Promise<User> {
    const created = await repo.create(dto);
    await setJSON(k("user", created.userId), created);
    // Invalidate list caches (example with limit 100, you can invalidate more if you use others)
    await delKey(k("users", `limit:${100}`));
    return created;
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const payload: { name?: string; email?: string } = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.email !== undefined) payload.email = dto.email;

    const updated = await repo.update(id, payload);
    await setJSON(k("user", id), updated);
    return updated;
}

export async function deleteUser(id: string): Promise<void> {
    await repo.remove(id);
    await delKey(k("user", id));
}
