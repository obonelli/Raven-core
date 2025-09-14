import { z } from 'zod';

export const LoginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
    }),
});

export type LoginDto = z.infer<typeof LoginSchema>['body'];

export const RefreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(10),
    }),
});
