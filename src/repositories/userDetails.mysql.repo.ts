// src/repositories/userDetails.mysql.repo.ts
import { prisma } from '../config/prisma.js';
import type { UserDetails } from '../models/userDetails.model.js';
import type { UserDetails as PrismaUserDetails } from '@prisma/client';

function toDomain(row: PrismaUserDetails): UserDetails {
    return {
        id: row.id,
        userId: row.userId,
        phone: row.phone ?? null,
        address: row.address ?? null,
        city: row.city ?? null,
        country: row.country ?? null,
        zip: row.zip ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export async function getByUserId(userId: string): Promise<UserDetails | null> {
    const row = await prisma.userDetails.findUnique({ where: { userId } });
    return row ? toDomain(row) : null;
}

export async function create(
    userId: string,
    data: Omit<UserDetails, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<UserDetails> {
    const row = await prisma.userDetails.create({
        data: {
            userId,
            phone: data.phone ?? null,
            address: data.address ?? null,
            city: data.city ?? null,
            country: data.country ?? null,
            zip: data.zip ?? null,
        },
    });
    return toDomain(row);
}

export async function update(
    userId: string,
    data: Partial<Omit<UserDetails, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserDetails> {
    const row = await prisma.userDetails.update({
        where: { userId },
        data: {
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.address !== undefined ? { address: data.address } : {}),
            ...(data.city !== undefined ? { city: data.city } : {}),
            ...(data.country !== undefined ? { country: data.country } : {}),
            ...(data.zip !== undefined ? { zip: data.zip } : {}),
        },
    });
    return toDomain(row);
}

export async function remove(userId: string): Promise<void> {
    await prisma.userDetails.delete({ where: { userId } });
}
