// src/schemas/user.schema.ts
import { z } from "zod";

export const CreateUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
});

export const UpdateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
