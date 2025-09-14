import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { CreateUserDetailsSchema, PatchUserDetailsSchema } from "../schemas/userDetails.schema.js";
import { IdParamSchema } from "../schemas/common.schema.js";
import * as controller from "../controllers/userDetails.controller.js";

const r = Router({ mergeParams: true });

// GET /api/users/:id/details
r.get("/", validateParams(IdParamSchema), controller.getUserDetails);

// POST /api/users/:id/details
r.post("/", validateParams(IdParamSchema), validateBody(CreateUserDetailsSchema), controller.createUserDetails);

// PATCH /api/users/:id/details
r.patch("/", validateParams(IdParamSchema), validateBody(PatchUserDetailsSchema), controller.patchUserDetails);

// DELETE /api/users/:id/details
r.delete("/", validateParams(IdParamSchema), controller.deleteUserDetails);

export default r;
