// src/schemas/common.schema.ts
import { z } from "zod";

export const IdParamSchema = z.object({
    id: z.string().min(1, "id is required"),
    // if you want to force UUID → z.string().uuid("invalid uuid")
});
