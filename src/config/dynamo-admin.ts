// src/config/dynamo-admin.ts
import {
    DynamoDBClient,
    CreateTableCommand,
    DescribeTableCommand,
    waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { fromEnv } from '@aws-sdk/credential-provider-env';

const AWS_REGION = (process.env.AWS_REGION || 'us-east-1').trim();

const admin = new DynamoDBClient({
    region: AWS_REGION,
    credentials: fromEnv(),
});

/** Create the users table if it doesn't exist (no-op if it does). */
export async function ensureUsersTable(tableName: string) {
    // 1) Exists?
    try {
        await admin.send(new DescribeTableCommand({ TableName: tableName }));
        console.log(`✔ DynamoDB table "${tableName}" already exists`);
        return;
    } catch (e: any) {
        if (e?.name !== 'ResourceNotFoundException') throw e;
    }

    console.log(`⏳ Creating DynamoDB table "${tableName}"...`);

    // 2) Create (simple PK: userId). On-demand billing.
    await admin.send(
        new CreateTableCommand({
            TableName: tableName,
            BillingMode: 'PAY_PER_REQUEST',
            AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
            KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        })
    );

    // 3) Wait until ACTIVE
    await waitUntilTableExists({ client: admin, maxWaitTime: 120 }, { TableName: tableName });
    console.log(`✅ DynamoDB table "${tableName}" created`);
}
