import { Router, type Router as RouterType } from 'express';
import { ddb, DDB_USERS_TABLE } from '../config/dynamo.js';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { prisma } from '../config/prisma.js';
import { rPing } from '../config/redis.js';

const r: RouterType = Router();

// DynamoDB
r.get('/dynamo', async (_req, res, next) => {
    try {
        await ddb.send(new ScanCommand({ TableName: DDB_USERS_TABLE, Limit: 1 }));
        res.json({ ok: true, service: 'dynamo' });
    } catch (err) {
        next(err);
    }
});

// MySQL
r.get('/mysql', async (_req, res, next) => {
    try {
        await prisma.$queryRawUnsafe('SELECT 1');
        res.json({ ok: true, service: 'mysql' });
    } catch (err) {
        next(err);
    }
});

// Redis
r.get('/redis', async (_req, res, next) => {
    try {
        const ok = await rPing();
        res.json({ ok, service: 'redis' });
    } catch (err) {
        next(err);
    }
});

export default r;
