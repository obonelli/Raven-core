// src/services/user.service.ts
import * as repo from "../repositories/user.dynamo.repo.js";
import type { User } from "../models/user.model.js";
import type { CreateUserDto, UpdateUserDto } from "../schemas/user.schema.js";

export async function listUsers(limit = 100): Promise<User[]> {
    return repo.list(limit);
}

export async function getUser(id: string): Promise<User | null> {
    return repo.getById(id);
}

export async function createUser(dto: CreateUserDto): Promise<User> {
    // dto: { name: string; email: string }
    return repo.create(dto);
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    // Remove undefined keys so types match: { name?: string; email?: string }
    const payload: { name?: string; email?: string } = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.email !== undefined) payload.email = dto.email;

    return repo.update(id, payload);
}

export async function deleteUser(id: string): Promise<void> {
    await repo.remove(id);
}
