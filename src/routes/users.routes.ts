import { Router } from "express";
import { validateBody } from "../middlewares/validate.js";
import { CreateUserSchema, UpdateUserSchema } from "../schemas/user.schema.js";
import * as controller from "../controllers/user.controller.js";

const r = Router();

r.get("/", controller.listUsers);
r.get("/:id", controller.getUserById);

// Body validation via middleware (Zod)
r.post("/", validateBody(CreateUserSchema), controller.createUser);
r.put("/:id", validateBody(UpdateUserSchema), controller.updateUser);

r.delete("/:id", controller.deleteUser);

export default r;
