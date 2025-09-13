import { z } from "zod";

// For POST /users
export const CreateUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Must be a valid email"),
});

// For PATCH /users/:id
export const UpdateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
});

// Infer DTO types directly from schemas
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
