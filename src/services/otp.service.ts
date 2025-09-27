// src/services/otp.service.ts
import { randomInt, createHmac } from 'crypto';
import {
    PutCommand,
    QueryCommand,
    UpdateCommand,
    type QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { ddb } from '../config/dynamo.js';
import { DDB_PHONE_OTP_TABLE } from '../config/dynamo.js';
import { sendWhatsAppText } from '../providers/whatsapp.js';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { setWhatsapp, setWhatsappVerified } from '../repositories/user.dynamo.repo.js';

const TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS ?? 600);
const COOLDOWN_SECONDS = Number(process.env.OTP_COOLDOWN_SECONDS ?? 60);
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
const DEFAULT_REGION = String(process.env.OTP_DEFAULT_REGION ?? 'MX') as CountryCode;
const OTP_SECRET = String(process.env.OTP_SECRET ?? 'change-me');

type OtpItem = {
    userId: string;
    sk: string;               // OTP#<timestamp>
    phone: string;            // E.164: +525512345678
    codeHash: string;
    attempts: number;
    status: 'pending' | 'verified' | 'blocked';
    createdAt: number;        // epoch ms
    ttl: number;              // epoch seconds (TTL)
};

class HttpError extends Error {
    status?: number;
    code?: string;
    constructor(message: string, status?: number, code?: string) {
        super(message);
        if (status !== undefined) this.status = status;
        if (code !== undefined) this.code = code;
    }
}

function nowMs() { return Date.now(); }
function toEpochSeconds(ms: number) { return Math.floor(ms / 1000); }

function e164(phone: string): string {
    const p = parsePhoneNumberFromString(phone, DEFAULT_REGION);
    if (!p || !p.isValid()) {
        throw new HttpError('Invalid phone', 400, 'invalid_phone');
    }
    return p.number; // +5255...
}

function code6(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function hash(code: string, userId: string) {
    return createHmac('sha256', OTP_SECRET).update(`${userId}:${code}`).digest('hex');
}

async function lastOtpForUser(userId: string): Promise<OtpItem | null> {
    const r: QueryCommandOutput = await ddb.send(new QueryCommand({
        TableName: DDB_PHONE_OTP_TABLE,
        KeyConditionExpression: '#u = :u AND begins_with(#sk, :p)',
        ExpressionAttributeNames: { '#u': 'userId', '#sk': 'sk' },
        ExpressionAttributeValues: { ':u': userId, ':p': 'OTP#' },
        ScanIndexForward: false,
        Limit: 1,
    }));
    const item = (r.Items && r.Items[0] ? (r.Items[0] as unknown as OtpItem) : null);
    return item;
}

export async function startPhoneVerification(params: { userId: string; phone: string }) {
    const phoneE164 = e164(params.phone);
    const last = await lastOtpForUser(params.userId);

    // cooldown
    if (last && (nowMs() - last.createdAt) < COOLDOWN_SECONDS * 1000) {
        throw new HttpError('Rate limited', 429, 'rate_limited');
    }

    const code = code6();
    const timestamp = nowMs();
    const item: OtpItem = {
        userId: params.userId,
        sk: `OTP#${timestamp}`,
        phone: phoneE164,
        codeHash: hash(code, params.userId),
        attempts: 0,
        status: 'pending',
        createdAt: timestamp,
        ttl: toEpochSeconds(timestamp + TTL_SECONDS * 1000),
    };

    await ddb.send(new PutCommand({
        TableName: DDB_PHONE_OTP_TABLE,
        Item: item,
    }));

    // WhatsApp Cloud API espera waid sin '+'
    const waid = phoneE164.replace('+', '');
    const minutes = Math.max(1, Math.round(TTL_SECONDS / 60));
    await sendWhatsAppText(
        waid,
        `Your Raven Prime verification code: ${code}\nExpires in ${minutes} min. Do not share this code.`
    );

    // opcional: sincroniza phone en detalles o usuario (aún no verificado)
    await setWhatsapp(params.userId, phoneE164);
}

export async function confirmPhoneVerification(params: { userId: string; phone: string; code: string }) {
    const phoneE164 = e164(params.phone);
    const current = await lastOtpForUser(params.userId);
    if (!current) {
        throw new HttpError('No code requested', 400, 'otp_missing');
    }
    if (current.status !== 'pending') {
        throw new HttpError('OTP not pending', 400, 'otp_not_pending');
    }
    if (current.phone !== phoneE164) {
        throw new HttpError('Phone mismatch', 400, 'phone_mismatch');
    }
    if (toEpochSeconds(nowMs()) > current.ttl) {
        throw new HttpError('OTP expired', 400, 'otp_expired');
    }
    if (current.attempts >= MAX_ATTEMPTS) {
        throw new HttpError('Too many attempts', 429, 'too_many_attempts');
    }

    const ok = current.codeHash === hash(params.code, params.userId);

    if (!ok) {
        await ddb.send(new UpdateCommand({
            TableName: DDB_PHONE_OTP_TABLE,
            Key: { userId: current.userId, sk: current.sk },
            UpdateExpression: 'SET attempts = attempts + :one',
            ExpressionAttributeValues: { ':one': 1 },
        }));
        throw new HttpError('Invalid code', 400, 'otp_invalid');
    }

    // éxito: marcar item como verified
    await ddb.send(new UpdateCommand({
        TableName: DDB_PHONE_OTP_TABLE,
        Key: { userId: current.userId, sk: current.sk },
        UpdateExpression: 'SET #st = :v',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':v': 'verified' },
    }));

    // persiste en Users (DDB) banderas finales
    await setWhatsapp(params.userId, phoneE164);
    await setWhatsappVerified(params.userId, true);
}
