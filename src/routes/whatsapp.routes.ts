import { Router, Request, Response } from 'express';
import { createReminderFromText } from '../services/reminderFromText.service.js';
import { sendWhatsAppText } from '../providers/whatsapp.js'

const router = Router();

// GET /webhooks/whatsapp  (verificación de Meta)
router.get('/webhooks/whatsapp', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
});

// POST /webhooks/whatsapp  (mensajes entrantes)
router.post('/webhooks/whatsapp', async (req: Request, res: Response) => {
    // Meta envía un envelope: entry[0].changes[0].value.messages[0]
    try {
        const entry = req.body?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const messages = value?.messages;
        const contacts = value?.contacts;

        if (!messages || !contacts) {
            // puede ser una notificación de status; respondemos 200 para que no reintente
            return res.sendStatus(200);
        }

        const msg = messages[0];
        const from = msg.from;                       // ej: "52181XXXXXXXX"
        const text = msg.text?.body?.trim() ?? '';   // texto del usuario
        const waName = contacts?.[0]?.profile?.name; // nombre en WA

        // 1) primer “hola/conectar” → dar bienvenida
        if (/conectar|vincular|hola|buenas/i.test(text)) {
            // TODO: aquí puedes vincular user<->waid si ya tienes sesión pagada con ese número
            await sendWhatsAppText(from, `Hola ${waName ?? ''} 👋 Soy Raven Assist.
Estoy lista para recibir tus recordatorios.
Ejemplos:
• pagar Telmex mañana 9am
• cita médica 3 oct 4pm
• renovar INE en 2 meses

Cuando quieras, escríbeme el recordatorio en una sola frase.`);
            return res.sendStatus(200);
        }

        // 2) cualquier otra frase → intentar parsear y crear recordatorio
        const result = await createReminderFromText({
            waid: from,
            text,
            // puedes detectar la tz más adelante; de momento CDMX por defecto
            tz: 'America/Mexico_City',
            channel: 'WHATSAPP',
        });

        if (result.ok) {
            const { title, dueAtLocal } = result;
            await sendWhatsAppText(from, `✅ Listo: *${title}* para *${dueAtLocal}*.
Te avisaré cuando llegue la hora.`);
        } else {
            await sendWhatsAppText(from, `No pude entender la fecha/hora 😅
Prueba algo como:
• "pagar Telmex mañana 9am"
• "renovar INE en 2 meses"
• "cita médica 3 oct 4pm"`);
        }

        return res.sendStatus(200);
    } catch (err) {
        console.error('[whatsapp webhook] error', err);
        return res.sendStatus(200); // responder 200 para evitar reintentos masivos
    }
});

export default router;
