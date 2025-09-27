import { Router, type Router as RouterType } from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateBody } from '../middlewares/validate.js';
import { VerifyStartSchema, VerifyConfirmSchema } from '../schemas/verify.schema.js';
import * as controller from '../controllers/verify.controller.js';

const r: RouterType = Router({ mergeParams: true });

r.post('/phone/start', requireAuth, validateBody(VerifyStartSchema.shape.body), controller.start);
r.post('/phone/confirm', requireAuth, validateBody(VerifyConfirmSchema.shape.body), controller.confirm);

export default r;
