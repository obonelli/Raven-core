// src/routes/whatsapp.routes.ts
import { Router, Request, Response } from 'express';
import { createReminderFromText } from '../services/reminderFromText.service.js';
import { sendWhatsAppText, markMessageRead } from '../providers/whatsapp.js';

const router = Router();

type QueryParam = string | string[] | undefined;
const qpToString = (v: QueryParam): string | undefined => (Array.isArray(v) ? v[0] : v);

/**
 * GET /webhooks/whatsapp
 * Meta verification: echoes hub.challenge when verify token matches.
 */
router.get('/webhooks/whatsapp', (req: Request, res: Response) => {
    const mode = qpToString(req.query['hub.mode'] as QueryParam);
    const token = qpToString(req.query['hub.verify_token'] as QueryParam);
    const challenge = qpToString(req.query['hub.challenge'] as QueryParam);

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
        return res.status(200).type('text/plain').send(challenge);
    }
    return res.sendStatus(403);
});

/**
 * POST /webhooks/whatsapp
 * Receives WhatsApp notifications. Always respond 200 quickly.
 */
router.post('/webhooks/whatsapp', async (req: Request, res: Response) => {
    // responder rápido para evitar reintentos
    res.sendStatus(200);

    try {
        const body = req.body;
        const entries = body?.entry ?? [];
        for (const entry of entries) {
            const changes = entry?.changes ?? [];
            for (const change of changes) {
                const value = change?.value;

                // Mensajes entrantes
                const messages = value?.messages ?? [];
                for (const msg of messages) {
                    const from = msg?.from as string | undefined;     // "5218332087965" (sin '+')
                    const type = msg?.type as string | undefined;
                    const mid = msg?.id as string | undefined;

                    if (mid) {
                        // opcional: márcalo como leído
                        markMessageRead(mid).catch(() => { });
                    }

                    let text: string | undefined;
                    if (type === 'text') {
                        text = msg?.text?.body;
                    } else if (type === 'interactive') {
                        text = msg?.interactive?.button_reply?.title ?? msg?.interactive?.list_reply?.title;
                    }
                    if (!from || !text) continue;

                    const result = await createReminderFromText({
                        waid: from,
                        text,
                        tz: 'America/Mexico_City',
                        channel: 'WHATSAPP',
                    });

                    if (result?.ok) {
                        const when = result.dueAtLocal ?? result.dueAtISO;
                        await sendWhatsAppText(from, `✅ Reminder set: "${result.title}" • ${when}`);
                    } else {
                        await sendWhatsAppText(
                            from,
                            `I couldn't understand the time. Try e.g.:
• "pay Telmex tomorrow 9am"
• "renew INE in 2 months"
• "doctor appointment Oct 3 4pm"`
                        );
                    }
                }

                // Status callbacks (delivered, read, failed...) — si quieres loguear:
                // const statuses = value?.statuses ?? [];
                // for (const st of statuses) {
                //     // console.log('[wa status]', st.status, st.id);
                // }
            }
        }
    } catch (err) {
        console.error('[whatsapp webhook] error', err);
    }
});

export default router;
