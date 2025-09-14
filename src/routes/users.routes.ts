import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { CreateUserSchema, UpdateUserSchema } from "../schemas/user.schema.js";
import { IdParamSchema } from "../schemas/common.schema.js";
import * as controller from "../controllers/user.controller.js";

const r = Router();

// GET /api/users
r.get("/", controller.listUsers);

// GET /api/users/:id
r.get("/:id", validateParams(IdParamSchema), controller.getUserById);

// POST /api/users
r.post("/", validateBody(CreateUserSchema), controller.createUser);

// PUT /api/users/:id
r.put(
    "/:id",
    validateParams(IdParamSchema),
    validateBody(UpdateUserSchema),
    controller.updateUser
);

// DELETE /api/users/:id
r.delete("/:id", validateParams(IdParamSchema), controller.deleteUser);

export default r;
