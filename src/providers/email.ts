// src/providers/email.ts
import 'dotenv/config';
import sgMail, { MailDataRequired } from '@sendgrid/mail';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isDev = NODE_ENV === 'development';

const apiKey = (process.env.SENDGRID_API_KEY || '').trim();
const from = (process.env.SENDGRID_FROM || '').trim();
const replyTo = (process.env.SENDGRID_REPLY_TO || from).trim();
const sandbox = process.env.SENDGRID_SANDBOX === '1';

if (!apiKey) {
    console.warn('[email] SENDGRID_API_KEY missing, email disabled');
} else {
    sgMail.setApiKey(apiKey);
}

type SendParams = {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
};

type SendGridErrorItem = {
    message: string;
    field?: string;
    help?: string;
};

type SendResult =
    | { ok: true; status: number; messageId?: string }
    | { ok: false; skipped?: true; status?: number; errors?: SendGridErrorItem[] };

function buildMsg({ to, subject, text, html }: SendParams): MailDataRequired {
    const content = [];
    if (text) {
        content.push({ type: 'text/plain', value: text });
    }
    if (html) {
        content.push({ type: 'text/html', value: html });
    }
    if (content.length === 0) {
        throw new Error('Either text or html content must be provided for the email.');
    }

    const base: MailDataRequired = {
        to,
        from,
        subject,
        replyTo,
        content: content as [{ type: string; value: string }, ...{ type: string; value: string }[]]
    };

    return isDev && sandbox
        ? { ...base, mailSettings: { sandboxMode: { enable: true } } }
        : base;
}

export async function sendEmail(params: SendParams): Promise<SendResult> {
    if (!apiKey || !from) return { ok: false, skipped: true };
    if (!params.text && !params.html) {
        throw new Error('Either text or html content must be provided for the email.');
    }

    const msg = buildMsg(params);

    try {
        const [res] = await sgMail.send(msg);

        const ok = res.statusCode >= 200 && res.statusCode < 300;
        const rawId = res.headers?.['x-message-id'];
        const messageId =
            typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;

        if (ok) {
            return { ok: true, status: res.statusCode, messageId };
        }
        return { ok: false, status: res.statusCode };
    } catch (err: unknown) {
        const maybe = err as {
            message?: string;
            response?: { statusCode?: number; body?: { errors?: SendGridErrorItem[] } };
        };

        const out: { ok: false; status?: number; errors?: SendGridErrorItem[] } = { ok: false };
        if (typeof maybe.response?.statusCode === 'number') out.status = maybe.response.statusCode;
        if (maybe.response?.body?.errors?.length) out.errors = maybe.response.body.errors;

        console.error('[email] send failed', { ...out, message: maybe.message });
        return out;
    }
}
