// src/schemas/userDetails.schema.ts
import { z } from 'zod';

export const CreateUserDetailsSchema = z.object({
    // We don't receive userId in body because it comes in :id (path)
    body: z.object({
        phone: z.string().min(5).max(30).optional(),
        address: z.string().min(3).max(120).optional(),
        city: z.string().min(2).max(60).optional(),
        country: z.string().min(2).max(60).optional(),
        zip: z.string().min(3).max(20).optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
    query: z.object({}).optional(),
});

export const PatchUserDetailsSchema = z.object({
    body: z.object({
        phone: z.string().min(5).max(30).optional(),
        address: z.string().min(3).max(120).optional(),
        city: z.string().min(2).max(60).optional(),
        country: z.string().min(2).max(60).optional(),
        zip: z.string().min(3).max(20).optional(),
    }).refine(obj => Object.keys(obj).length > 0, { message: 'At least one field is required' }),
    params: z.object({
        id: z.string().uuid(),
    }),
    query: z.object({}).optional(),
});

export type CreateUserDetailsDto = z.infer<typeof CreateUserDetailsSchema>['body'];
export type PatchUserDetailsDto = z.infer<typeof PatchUserDetailsSchema>['body'];
