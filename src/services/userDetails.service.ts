import * as usersRepo from "../repositories/user.dynamo.repo.js"; // Dynamo
import * as detailsRepo from "../repositories/userDetails.mysql.repo.js";
import type { CreateUserDetailsDto, PatchUserDetailsDto } from "../schemas/userDetails.schema.js";
import type { UserDetails } from "../models/userDetails.model.js";
import { getJSON, setJSON, delKey } from "../lib/cache.js";
import { buildCacheKey } from "../config/redis.js";

export async function getForUser(userId: string): Promise<UserDetails | null> {
    const user = await usersRepo.getById(userId);
    if (!user) return null;

    const key = buildCacheKey("userDetails", userId);
    const cached = await getJSON<UserDetails>(key);
    if (cached) return cached;

    const fresh = await detailsRepo.getByUserId(userId);
    if (fresh) await setJSON(key, fresh);
    return fresh;
}

export async function createForUser(userId: string, dto: CreateUserDetailsDto): Promise<UserDetails> {
    const user = await usersRepo.getById(userId);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

    const existing = await detailsRepo.getByUserId(userId);
    if (existing) throw Object.assign(new Error("Details already exist"), { status: 409 });

    const payload = {
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        country: dto.country ?? null,
        zip: dto.zip ?? null,
    };

    const created = await detailsRepo.create(userId, payload);
    await setJSON(buildCacheKey("userDetails", userId), created);
    return created;
}

export async function patchForUser(userId: string, dto: PatchUserDetailsDto): Promise<UserDetails> {
    const user = await usersRepo.getById(userId);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

    const existing = await detailsRepo.getByUserId(userId);
    if (!existing) throw Object.assign(new Error("Details not found"), { status: 404 });

    const data: Partial<Pick<UserDetails, "phone" | "address" | "city" | "country" | "zip">> = {};
    if ("phone" in dto) data.phone = dto.phone ?? null;
    if ("address" in dto) data.address = dto.address ?? null;
    if ("city" in dto) data.city = dto.city ?? null;
    if ("country" in dto) data.country = dto.country ?? null;
    if ("zip" in dto) data.zip = dto.zip ?? null;

    const updated = await detailsRepo.update(userId, data);
    await setJSON(buildCacheKey("userDetails", userId), updated);
    return updated;
}

export async function deleteForUser(userId: string): Promise<void> {
    const user = await usersRepo.getById(userId);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

    const existing = await detailsRepo.getByUserId(userId);
    if (!existing) throw Object.assign(new Error("Details not found"), { status: 404 });

    await detailsRepo.remove(userId);
    await delKey(buildCacheKey("userDetails", userId));
}