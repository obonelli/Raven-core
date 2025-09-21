// src/routes/index.ts
import { Router, type Router as RouterType } from 'express';
import usersRouter from './users.routes.js';
import userDetailsRouter from './userDetails.routes.js';
import healthRouter from './health.routes.js';
import remindersRouter from './reminders.routes.js';

const router: RouterType = Router();

router.use('/users', usersRouter);
router.use('/users/:id/details', userDetailsRouter);
router.use('/reminders', remindersRouter);
router.use('/health', healthRouter);

export default router;
