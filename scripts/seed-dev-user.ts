import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { ddb, DDB_USERS_TABLE } from '../src/config/dynamo';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

async function main() {
    const email = process.env.SEED_EMAIL ?? 'alice@example.com';
    const password = process.env.SEED_PASSWORD ?? 'secret123';
    const name = process.env.SEED_NAME ?? 'Alice Dev';

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const user = {
        userId: randomUUID(),
        email,
        name,
        passwordHash,        // <-- required for login
        createdAt: now,
        updatedAt: now,
    };

    await ddb.send(new PutCommand({
        TableName: DDB_USERS_TABLE,
        Item: user,
        // allow upsert in dev; use a condition in prod if you want strict create
    }));

    console.log('Seeded user:\n', { email, password, userId: user.userId });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
