import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validate } from '../middlewares/validate.js';
import { LoginSchema, RefreshSchema } from '../schemas/auth.schema.js';

const r = Router();

r.post('/login', validate(LoginSchema), login);
r.post('/refresh', validate(RefreshSchema), refresh);
r.post('/logout', logout);
r.get('/me', requireAuth, me);

export default r;
