import { Router, type Router as RouterType } from 'express';
import { validateBody, validateParams } from '../middlewares/validate.js';
import { CreateUserDetailsSchema, PatchUserDetailsSchema } from '../schemas/userDetails.schema.js';
import { IdParamSchema } from '../schemas/common.schema.js';
import * as controller from '../controllers/userDetails.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const r: RouterType = Router({ mergeParams: true });

r.get('/', requireAuth, validateParams(IdParamSchema), controller.getUserDetails);
r.post('/', requireAuth, validateParams(IdParamSchema), validateBody(CreateUserDetailsSchema), controller.createUserDetails);
r.patch('/', requireAuth, validateParams(IdParamSchema), validateBody(PatchUserDetailsSchema), controller.patchUserDetails);
r.delete('/', requireAuth, validateParams(IdParamSchema), controller.deleteUserDetails);

export default r;
