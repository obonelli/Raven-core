// src/routes/users.routes.ts
import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { CreateUserSchema, UpdateUserSchema } from "../schemas/user.schema.js";
import { IdParamSchema } from "../schemas/common.schema.js";
import * as controller from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const r = Router();

// GET /api/users (public)
r.get("/", controller.listUsers);

// GET /api/users/:id (public)
r.get("/:id", validateParams(IdParamSchema), controller.getUserById);

// POST /api/users (protected)
r.post(
    "/",
    requireAuth,
    validateBody(CreateUserSchema),
    controller.createUser
);

// PUT /api/users/:id (protected)
r.put(
    "/:id",
    requireAuth,
    validateParams(IdParamSchema),
    validateBody(UpdateUserSchema),
    controller.updateUser
);

// DELETE /api/users/:id (protected)
r.delete(
    "/:id",
    requireAuth,
    validateParams(IdParamSchema),
    controller.deleteUser
);

export default r;
