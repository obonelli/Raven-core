// src/routes/users.routes.ts
import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { CreateUserSchema, UpdateUserSchema } from "../schemas/user.schema.js";
import { IdParamSchema } from "../schemas/common.schema.js";
import * as controller from "../controllers/user.controller.js";

const r = Router();

r.get("/", controller.listUsers);
r.get("/:id", validateParams(IdParamSchema), controller.getUserById);
r.post("/", validateBody(CreateUserSchema), controller.createUser);
r.put("/:id", validateParams(IdParamSchema), validateBody(UpdateUserSchema), controller.updateUser);
r.delete("/:id", validateParams(IdParamSchema), controller.deleteUser);

export default r;
