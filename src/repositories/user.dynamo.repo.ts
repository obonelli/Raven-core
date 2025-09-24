// src/repositories/user.repo.ts
import { randomUUID } from "crypto";
import {
    GetCommand,
    PutCommand,
    ScanCommand,
    UpdateCommand,
    DeleteCommand,
    QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, DDB_USERS_TABLE } from "../config/dynamo.js";
import type { User } from "../models/user.model.js";

export async function list(limit = 100): Promise<User[]> {
    const r = await ddb.send(
        new ScanCommand({ TableName: DDB_USERS_TABLE, Limit: limit })
    );
    return (r.Items ?? []) as User[];
}

export async function getById(userId: string): Promise<User | null> {
    const r = await ddb.send(
        new GetCommand({ TableName: DDB_USERS_TABLE, Key: { userId } })
    );
    return (r.Item as User) ?? null;
}

export async function findByEmail(email: string): Promise<User[]> {
    const r = await ddb.send(
        new QueryCommand({
            TableName: DDB_USERS_TABLE,
            IndexName: "email-index",
            KeyConditionExpression: "#e = :e",
            ExpressionAttributeNames: { "#e": "email" },
            ExpressionAttributeValues: { ":e": email },
        })
    );
    return (r.Items ?? []) as User[];
}

export async function create(data: { name: string; email: string }): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
        userId: randomUUID(),
        name: data.name,
        email: data.email,
        createdAt: now,
        updatedAt: now,

        // defaults for new flags
        googleId: null,
        subscriptionActive: false,
        whatsappNumber: null,
        whatsappVerified: false,
    };

    await ddb.send(
        new PutCommand({
            TableName: DDB_USERS_TABLE,
            Item: user,
            ConditionExpression: "attribute_not_exists(userId)",
        })
    );
    return user;
}

/**
 * Generic update for allowed fields.
 */
type UpdateInput = {
    name?: string;
    email?: string;
    googleId?: string | null;
    subscriptionActive?: boolean;
    whatsappNumber?: string | null;
    whatsappVerified?: boolean;
};

export async function update(userId: string, data: UpdateInput): Promise<User> {
    const sets: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    const add = (attr: string, placeholder: string, value: unknown) => {
        sets.push(`${placeholder} = :${attr}`);
        names[placeholder] = attr;
        values[`:${attr}`] = value;
    };

    if (data.name !== undefined) add("name", "#n", data.name);
    if (data.email !== undefined) add("email", "#e", data.email);
    if (data.googleId !== undefined) add("googleId", "#g", data.googleId);
    if (data.subscriptionActive !== undefined)
        add("subscriptionActive", "#s", data.subscriptionActive);
    if (data.whatsappNumber !== undefined)
        add("whatsappNumber", "#w", data.whatsappNumber);
    if (data.whatsappVerified !== undefined)
        add("whatsappVerified", "#wv", data.whatsappVerified);

    // always update updatedAt
    sets.push("#u = :u");
    names["#u"] = "updatedAt";
    values[":u"] = new Date().toISOString();

    const r = await ddb.send(
        new UpdateCommand({
            TableName: DDB_USERS_TABLE,
            Key: { userId },
            UpdateExpression: "SET " + sets.join(", "),
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ConditionExpression: "attribute_exists(userId)",
            ReturnValues: "ALL_NEW",
        })
    );
    return r.Attributes as User;
}

export async function remove(userId: string): Promise<void> {
    await ddb.send(
        new DeleteCommand({
            TableName: DDB_USERS_TABLE,
            Key: { userId },
            ConditionExpression: "attribute_exists(userId)",
        })
    );
}

/* Convenience helpers */

export async function upsertGoogleUser(params: {
    email: string;
    name: string;
    googleId: string;
}): Promise<User> {
    const [existing] = await findByEmail(params.email);
    if (existing) {
        return update(existing.userId, {
            name: params.name,
            email: params.email,
            googleId: params.googleId,
        });
    }
    const created = await create({ name: params.name, email: params.email });
    return update(created.userId, { googleId: params.googleId });
}

export async function setSubscriptionActive(
    userId: string,
    active: boolean
): Promise<User> {
    return update(userId, { subscriptionActive: active });
}

export async function setWhatsapp(
    userId: string,
    phone: string | null
): Promise<User> {
    return update(userId, { whatsappNumber: phone, whatsappVerified: false });
}

export async function setWhatsappVerified(
    userId: string,
    verified: boolean
): Promise<User> {
    return update(userId, { whatsappVerified: verified });
}
