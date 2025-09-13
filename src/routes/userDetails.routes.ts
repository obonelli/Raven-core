// src/routes/userDetails.routes.ts
import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { CreateUserDetailsSchema, PatchUserDetailsSchema } from '../schemas/userDetails.schema';
import * as controller from '../controllers/userDetails.controller';

const r = Router({ mergeParams: true });

// GET /api/users/:id/details
r.get('/', controller.getUserDetails);

// POST /api/users/:id/details
r.post('/', validate(CreateUserDetailsSchema), controller.createUserDetails);

// PATCH /api/users/:id/details
r.patch('/', validate(PatchUserDetailsSchema), controller.patchUserDetails);

// DELETE /api/users/:id/details
r.delete('/', controller.deleteUserDetails);

export default r;
