// src/controllers/user.controller.ts
import type { Request, Response, NextFunction } from "express";
import { CreateUserSchema, UpdateUserSchema } from "../schemas/user.schema.js";
import * as svc from "../services/user.service.js";

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
        const users = await svc.listUsers();
        res.json(users);
    } catch (err) {
        next(err);
    }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await svc.getUser(String(req.params.id));
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        next(err);
    }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = CreateUserSchema.safeParse(req.body);
        if (!parsed.success)
            return res
                .status(400)
                .json({ message: "Invalid body", errors: parsed.error.flatten() });

        const user = await svc.createUser(parsed.data);
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
    try {
        const parsed = UpdateUserSchema.safeParse(req.body);
        if (!parsed.success)
            return res
                .status(400)
                .json({ message: "Invalid body", errors: parsed.error.flatten() });

        const user = await svc.updateUser(String(req.params.id), parsed.data);
        res.json(user);
    } catch (err) {
        next(err);
    }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
        await svc.deleteUser(String(req.params.id));
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}
