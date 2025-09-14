import { Router } from 'express';
import { ddb, DDB_USERS_TABLE } from '../config/dynamo.js';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { prisma } from '../config/prisma.js';
import { rPing } from '../config/redis.js'; // 👈 usar helper de config/redis

const r = Router();

// Health for DynamoDB
r.get('/dynamo', async (_req, res, next) => {
    try {
        // Operación ligera (no lee toda la tabla)
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

// Health for Redis (solo conectividad; no escribe)
r.get('/redis', async (_req, res, next) => {
    try {
        const ok = await rPing();
        res.json({ ok, service: 'redis' });
    } catch (err) {
        next(err);
    }
});

export default r;
