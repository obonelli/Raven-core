// src/routes/reminders.routes.ts
import { Router, type Router as RouterType } from 'express';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.js';
import { IdParamSchema } from '../schemas/common.schema.js';
import { ParseReminderSchema, CreateReminderSchema, ListRemindersQuerySchema, SnoozeReminderSchema } from '../schemas/reminders.schema.js';
import * as controller from '../controllers/reminders.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const r: RouterType = Router();

r.post('/parse', requireAuth, validateBody(ParseReminderSchema), controller.parseReminder);
r.post('/', requireAuth, validateBody(CreateReminderSchema), controller.createReminder);
r.get('/', requireAuth, validateQuery(ListRemindersQuerySchema), controller.listReminders);
r.post('/:id/snooze', requireAuth, validateParams(IdParamSchema), validateBody(SnoozeReminderSchema), controller.snoozeReminder);
r.post('/:id/done', requireAuth, validateParams(IdParamSchema), controller.completeReminder);

export default r;
