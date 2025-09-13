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

export async function update(
    userId: string,
    data: { name?: string; email?: string }
): Promise<User> {
    const sets: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    if (data.name !== undefined) {
        sets.push("#n = :n");
        names["#n"] = "name";
        values[":n"] = data.name;
    }
    if (data.email !== undefined) {
        sets.push("#e = :e");
        names["#e"] = "email";
        values[":e"] = data.email;
    }
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
