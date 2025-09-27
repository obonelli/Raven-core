import { z } from 'zod';

export const VerifyStartSchema = z.object({
    body: z.object({
        phone: z.string().min(6).max(20)
    })
});

export const VerifyConfirmSchema = z.object({
    body: z.object({
        phone: z.string().min(6).max(20),
        code: z.string().min(4).max(8)
    })
});
