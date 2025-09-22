// src/config/dynamo.ts
import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { fromEnv } from '@aws-sdk/credential-providers';

// Read & trim env (avoid hidden spaces/newlines)
const AWS_REGION = (process.env.AWS_REGION || 'us-east-1').trim();
export const DDB_BOOKINGS_TABLE = (process.env.DDB_TABLE || 'bookings').trim();
export const DDB_USERS_TABLE = (process.env.DDB_USERS_TABLE || 'users').trim();

// Flag para cortar cosas pesadas en test
const isTest = (process.env.NODE_ENV ?? 'development') === 'test';

// Force ENV credentials (ignore profile/SSO/EC2 metadata)
const client = new DynamoDBClient({
    region: AWS_REGION,
    credentials: fromEnv(),
});

export const ddb = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

// Self-check (solo en dev, nunca en test ni prod)
if (!isTest && process.env.NODE_ENV !== 'production') {
    (async () => {
        try {
            const akid = (process.env.AWS_ACCESS_KEY_ID || '').trim();
            const sts = new STSClient({ region: AWS_REGION, credentials: fromEnv() });
            const id = await sts.send(new GetCallerIdentityCommand({}));
            console.log('[AWS] identity', {
                account: id.Account,
                arn: id.Arn,
                akid: `${akid.slice(0, 4)}…${akid.slice(-4)}`,
            });
        } catch (e) {
            console.error('[AWS] STS check failed', e);
        }
    })();
}
