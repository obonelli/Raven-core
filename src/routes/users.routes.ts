// src/routes/users.routes.ts
import { Router } from "express";
import {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from "../controllers/user.controller.js";

const r = Router();

r.get("/", listUsers);
r.get("/:id", getUserById);
r.post("/", createUser);
r.put("/:id", updateUser);
r.delete("/:id", deleteUser);

export default r;
