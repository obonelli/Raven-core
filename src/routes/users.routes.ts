import { Router, type Router as RouterType } from 'express';
import { validateBody, validateParams } from '../middlewares/validate.js';
import { CreateUserSchema, UpdateUserSchema } from '../schemas/user.schema.js';
import { IdParamSchema } from '../schemas/common.schema.js';
import * as controller from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const r: RouterType = Router();

r.get('/', controller.listUsers);
r.get('/:id', validateParams(IdParamSchema), controller.getUserById);
r.post('/', requireAuth, validateBody(CreateUserSchema), controller.createUser);
r.put('/:id', requireAuth, validateParams(IdParamSchema), validateBody(UpdateUserSchema), controller.updateUser);
r.delete('/:id', requireAuth, validateParams(IdParamSchema), controller.deleteUser);

export default r;
