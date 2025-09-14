// src/routes/userDetails.routes.ts
import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { CreateUserDetailsSchema, PatchUserDetailsSchema } from "../schemas/userDetails.schema.js";
import { IdParamSchema } from "../schemas/common.schema.js";
import * as controller from "../controllers/userDetails.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const r = Router({ mergeParams: true });

// GET /api/users/:id/details (protected)
r.get(
    "/",
    requireAuth,
    validateParams(IdParamSchema),
    controller.getUserDetails
);

// POST /api/users/:id/details (protected)
r.post(
    "/",
    requireAuth,
    validateParams(IdParamSchema),
    validateBody(CreateUserDetailsSchema),
    controller.createUserDetails
);

// PATCH /api/users/:id/details (protected)
r.patch(
    "/",
    requireAuth,
    validateParams(IdParamSchema),
    validateBody(PatchUserDetailsSchema),
    controller.patchUserDetails
);

// DELETE /api/users/:id/details (protected)
r.delete(
    "/",
    requireAuth,
    validateParams(IdParamSchema),
    controller.deleteUserDetails
);

export default r;
