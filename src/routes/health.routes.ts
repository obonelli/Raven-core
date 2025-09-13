// src/routes/health.routes.ts
import { Router } from 'express';
import { ddb, DDB_USERS_TABLE } from '../config/dynamo';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { prisma } from '../config/prisma';

const r = Router();

// Health for DynamoDB
r.get('/dynamo', async (_req, res, next) => {
    try {
        // Try a lightweight operation (no need to fetch all)
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

export default r;
