// src/routes/index.ts
import { Router } from 'express';
import usersRouter from './users.routes.js';
import userDetailsRouter from './userDetails.routes.js';
import healthRouter from './health.routes.js';

const router = Router();

router.use('/users', usersRouter);
router.use('/users/:id/details', userDetailsRouter);
router.use('/health', healthRouter);

export default router;
