// src/routes/whatsapp.routes.ts
import { Router, Request, Response } from 'express';
import { createReminderFromText } from '../services/reminderFromText.service.js';
import { sendWhatsAppText } from '../providers/whatsapp.js';

const router = Router();

// Helper para normalizar query params a string
type QueryParam = string | string[] | undefined;
const qpToString = (v: QueryParam): string | undefined =>
    Array.isArray(v) ? v[0] : v;

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
    try {
        const body = req.body;

        // Meta may send different shapes; we guard before accessing
        const entries = body?.entry ?? [];
        for (const entry of entries) {
            const changes = entry?.changes ?? [];
            for (const change of changes) {
                const value = change?.value;
                const messages = value?.messages ?? [];

                for (const msg of messages) {
                    const from = msg?.from as string | undefined; // E.164 like +521...
                    const type = msg?.type as string | undefined;

                    // Only handle text for now
                    let text: string | undefined;
                    if (type === 'text') {
                        text = msg?.text?.body;
                    } else if (type === 'interactive') {
                        // Optional: capture button/list replies
                        text =
                            msg?.interactive?.button_reply?.title ??
                            msg?.interactive?.list_reply?.title;
                    }

                    if (!from || !text) continue;

                    // Try to create a reminder from free text
                    const result = await createReminderFromText({
                        waid: from,
                        text,
                        tz: 'America/Mexico_City', // you can switch to user-specific tz later
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
            }
        }

        // Always reply 200 to stop retries
        return res.sendStatus(200);
    } catch (err) {
        console.error('[whatsapp webhook] error', err);
        // Still 200 to avoid massive retries
        return res.sendStatus(200);
    }
});

export default router;
