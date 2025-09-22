import {
    DynamoDBClient,
    CreateTableCommand,
    DescribeTableCommand,
    waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { fromEnv } from '@aws-sdk/credential-providers';

const AWS_REGION = (process.env.AWS_REGION ?? 'us-east-1').trim();
const isTest = (process.env.NODE_ENV ?? 'development') === 'test';

const admin = new DynamoDBClient({
    region: AWS_REGION,
    credentials: fromEnv(),
});

function hasName(err: unknown): err is { name: string } {
    return (
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        typeof (err as { name?: unknown }).name === 'string'
    );
}

export async function ensureUsersTable(tableName: string) {
    if (isTest) return; // ⬅️ en tests no intentes hablar con Dynamo

    try {
        await admin.send(new DescribeTableCommand({ TableName: tableName }));
        console.log(`✔ DynamoDB table "${tableName}" already exists`);
        return;
    } catch (e: unknown) {
        if (!hasName(e) || e.name !== 'ResourceNotFoundException') throw e;
    }

    console.log(`⏳ Creating DynamoDB table "${tableName}"...`);

    await admin.send(
        new CreateTableCommand({
            TableName: tableName,
            BillingMode: 'PAY_PER_REQUEST',
            AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
            KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        })
    );

    await waitUntilTableExists(
        { client: admin, maxWaitTime: 120 },
        { TableName: tableName }
    );

    console.log(`✅ DynamoDB table "${tableName}" created`);
}

export { admin };
