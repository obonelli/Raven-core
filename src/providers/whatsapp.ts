// src/providers/whatsapp.ts
import { request } from 'undici';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isTest = NODE_ENV === 'test';

const API_VERSION = process.env.WHATSAPP_API_VERSION?.trim() || 'v23.0';
const PHONE_ID = process.env.WHATSAPP_PHONE_ID?.trim() || '';
const TOKEN = process.env.WHATSAPP_TOKEN?.trim() || '';

if (!isTest) {
    if (!PHONE_ID) throw new Error('Missing WHATSAPP_PHONE_ID');
    if (!TOKEN) throw new Error('Missing WHATSAPP_TOKEN');
}

const API = `https://graph.facebook.com/${API_VERSION}`;

type SendWhatsAppParams = { toWaid: string; text: string };

/**
 * Enviar mensaje de texto simple por WhatsApp Cloud API
 */
export async function sendWhatsApp({ toWaid, text }: SendWhatsAppParams) {
    if (isTest) {
        // no-op en test
        return;
    }

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

/**
 * Wrapper para compatibilidad con el resto del código
 */
export async function sendWhatsAppText(toWaid: string, text: string) {
    return sendWhatsApp({ toWaid, text });
}

/**
 * Marcar un mensaje como leído (opcional)
 */
export async function markMessageRead(messageId: string) {
    if (isTest) {
        // no-op en test
        return;
    }

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
