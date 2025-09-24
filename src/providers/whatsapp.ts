// src/providers/whatsapp.ts
import { request } from 'undici';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isTest = NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';
const WHATSAPP_DISABLED = String(process.env.WHATSAPP_DISABLED ?? '').toLowerCase() === 'true';

const API_VERSION = (process.env.WHATSAPP_API_VERSION ?? 'v23.0').trim();
const PHONE_ID = (process.env.WHATSAPP_PHONE_ID ?? '').trim();
const TOKEN = (process.env.WHATSAPP_TOKEN ?? '').trim();

const API = `https://graph.facebook.com/${API_VERSION}`;

type SendWhatsAppParams = { toWaid: string; text: string };

function hasCreds() {
    return PHONE_ID.length > 0 && TOKEN.length > 0;
}

function shouldNoop() {
    return isTest || WHATSAPP_DISABLED || !hasCreds();
}

export async function sendWhatsApp({ toWaid, text }: SendWhatsAppParams) {
    if (shouldNoop()) return;

    const url = `${API}/${PHONE_ID}/messages`;
    const res = await request(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: toWaid,
            type: 'text',
            text: { body: text },
        }),
    });

    if (res.statusCode >= 300) {
        const body = await res.body.text();
        console.error('[whatsapp.send] error', res.statusCode, body);
        throw new Error(`WhatsApp API ${res.statusCode}`);
    }
}

export async function sendWhatsAppText(toWaid: string, text: string) {
    return sendWhatsApp({ toWaid, text });
}

export async function markMessageRead(messageId: string) {
    if (shouldNoop()) return;

    const url = `${API}/${PHONE_ID}/messages`;
    const res = await request(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
        }),
    });

    if (res.statusCode >= 300) {
        const body = await res.body.text();
        console.error('[whatsapp.read] error', res.statusCode, body);
    }
}
