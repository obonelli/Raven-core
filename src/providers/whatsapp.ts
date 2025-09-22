import { request } from 'undici';

const API = 'https://graph.facebook.com/v20.0';

type SendWhatsAppParams = { toWaid: string; text: string };

/**
 * Envío “base” usando la API de WhatsApp (Meta)
 */
export async function sendWhatsApp({ toWaid, text }: SendWhatsAppParams) {
    const token = process.env.WHATSAPP_TOKEN!;
    const phoneId = process.env.WHATSAPP_PHONE_ID!;
    const url = `${API}/${phoneId}/messages`;

    const res = await request(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
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
 * Wrapper para compatibilidad con las rutas actuales.
 * Firma: (toWaid, text)
 */
export async function sendWhatsAppText(toWaid: string, text: string) {
    return sendWhatsApp({ toWaid, text });
}
