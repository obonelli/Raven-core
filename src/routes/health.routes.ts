// src/routes/health.routes.ts
import { Router } from 'express';
import { ddb, DDB_USERS_TABLE } from '../config/dynamo.js';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';

const r = Router();

// Health for DynamoDB
r.get('/dynamo', async (_req, res, next) => {
    try {
        // Lightweight operation (no need to fetch all)
        await ddb.send(new ScanCommand({ TableName: DDB_USERS_TABLE, Limit: 1 }));
        res.json({ ok: true, service: 'dynamo' });
    } catch (err) {
        next(err);
    }
});

// Health for MySQL
r.get('/mysql', async (_req, res, next) => {
    try {
        await prisma.$queryRawUnsafe('SELECT 1');
        res.json({ ok: true, service: 'mysql' });
    } catch (err) {
        next(err);
    }
});

// Health for Redis
r.get('/redis', async (_req, res, next) => {
    try {
        await redis.set('health:ping', '1', { ex: 5 });
        const v = await redis.get('health:ping');
        res.json({ ok: v === '1', service: 'redis' });
    } catch (err) {
        next(err);
    }
});

export default r;
