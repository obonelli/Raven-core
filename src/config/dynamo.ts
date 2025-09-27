// src/config/dynamo.ts
import 'dotenv/config';
import {
    DynamoDBClient,
    CreateTableCommand,
    DescribeTableCommand,
    waitUntilTableExists,
    UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { fromEnv } from '@aws-sdk/credential-providers';

/* ───────────────────────────────
 * ENV & clientes
 * ─────────────────────────────── */
const AWS_REGION = (process.env.AWS_REGION || 'us-east-1').trim();
export const DDB_BOOKINGS_TABLE = (process.env.DDB_TABLE || 'bookings').trim();
export const DDB_USERS_TABLE = (process.env.DDB_USERS_TABLE || 'users').trim();
export const DDB_PHONE_OTP_TABLE = (process.env.DDB_PHONE_OTP_TABLE || 'raven-phone-otp').trim();

const isTest = (process.env.NODE_ENV ?? 'development') === 'test';

const rawClient = new DynamoDBClient({
    region: AWS_REGION,
    credentials: fromEnv(),
});

export const ddb = DynamoDBDocumentClient.from(rawClient, {
    marshallOptions: { removeUndefinedValues: true },
});

/* ───────────────────────────────
 * Helpers
 * ─────────────────────────────── */
function hasName(err: unknown): err is { name: string } {
    if (typeof err !== 'object' || err === null) return false;
    const obj = err as Record<string, unknown>;
    return typeof obj.name === 'string';
}

/* ───────────────────────────────
 * Ensure USERS table (ya existente)
 * ─────────────────────────────── */
export async function ensureUsersTable(tableName: string) {
    if (isTest) return;

    try {
        await rawClient.send(new DescribeTableCommand({ TableName: tableName }));
        console.log(`✔ DynamoDB table "${tableName}" already exists`);
        return;
    } catch (e: unknown) {
        if (!hasName(e) || e.name !== 'ResourceNotFoundException') throw e;
    }

    console.log(`⏳ Creating DynamoDB table "${tableName}"...`);
    await rawClient.send(
        new CreateTableCommand({
            TableName: tableName,
            BillingMode: 'PAY_PER_REQUEST',
            AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
            KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        }),
    );
    await waitUntilTableExists({ client: rawClient, maxWaitTime: 120 }, { TableName: tableName });
    console.log(`✅ DynamoDB table "${tableName}" created`);
}

/* ───────────────────────────────
 * Ensure PHONE_OTP table (NUEVA)
 * PK: userId (HASH) + sk (RANGE) con prefijo "OTP#..."
 * GSI: phone-index (phone, sk) para auditoría/limpieza
 * TTL: atributo "ttl"
 * ─────────────────────────────── */
export async function ensurePhoneOtpTable(tableName: string) {
    if (isTest) return;

    try {
        await rawClient.send(new DescribeTableCommand({ TableName: tableName }));
        console.log(`✔ DynamoDB table "${tableName}" already exists`);
    } catch (e: unknown) {
        if (!hasName(e) || e.name !== 'ResourceNotFoundException') throw e;

        console.log(`⏳ Creating DynamoDB table "${tableName}" (OTP)...`);
        await rawClient.send(
            new CreateTableCommand({
                TableName: tableName,
                BillingMode: 'PAY_PER_REQUEST',
                AttributeDefinitions: [
                    { AttributeName: 'userId', AttributeType: 'S' },
                    { AttributeName: 'sk', AttributeType: 'S' },
                    { AttributeName: 'phone', AttributeType: 'S' },
                ],
                KeySchema: [
                    { AttributeName: 'userId', KeyType: 'HASH' },
                    { AttributeName: 'sk', KeyType: 'RANGE' },
                ],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: 'phone-index',
                        KeySchema: [
                            { AttributeName: 'phone', KeyType: 'HASH' },
                            { AttributeName: 'sk', KeyType: 'RANGE' },
                        ],
                        Projection: { ProjectionType: 'ALL' },
                    },
                ],
            }),
        );

        await waitUntilTableExists({ client: rawClient, maxWaitTime: 180 }, { TableName: tableName });
        console.log(`✅ DynamoDB table "${tableName}" created`);
    }

    // TTL
    try {
        await rawClient.send(
            new UpdateTimeToLiveCommand({
                TableName: tableName,
                TimeToLiveSpecification: { AttributeName: 'ttl', Enabled: true },
            }),
        );
        console.log(`✔ TTL enabled on "${tableName}" (attribute "ttl")`);
    } catch (e) {
        console.warn(`⚠ TTL enable warning on "${tableName}":`, e);
    }
}

/* ───────────────────────────────
 * Arranque: auto-verificación de identidad (solo dev) y ensure de tablas
 * ─────────────────────────────── */
if (!isTest && process.env.NODE_ENV !== 'production') {
    (async () => {
        try {
            const akid = (process.env.AWS_ACCESS_KEY_ID || '').trim();
            const sts = new STSClient({ region: AWS_REGION, credentials: fromEnv() });
            const id = await sts.send(new GetCallerIdentityCommand({}));
            console.log('[AWS] identity', {
                account: id.Account,
                arn: id.Arn,
                akid: akid ? `${akid.slice(0, 4)}…${akid.slice(-4)}` : '',
            });
        } catch (e) {
            console.error('[AWS] STS check failed', e);
        }
    })();
}

/** Llama esto al boot del server (no en test). */
export async function ensureDynamoInfra() {
    if (isTest) return;
    await ensureUsersTable(DDB_USERS_TABLE);
    await ensurePhoneOtpTable(DDB_PHONE_OTP_TABLE);
}

export { rawClient as admin };
