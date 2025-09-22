// src/services/parse.service.ts
import * as chrono from 'chrono-node';

export interface ParseInput { text: string; tz?: string; }
export interface ParseOutput {
    title: string;
    dueAtISO?: string;
    rrule?: string;
    channel?: 'EMAIL' | 'WHATSAPP' | 'SMS';
    category?: string;
    confidence: number;
    notes?: string;
}

type LlmOutput = Partial<{
    title: string;
    dueAtISO: string;
    rrule: string;
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
    category: string;
    notes: string;
    confidence: number;
}>;

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY ?? '').trim();
const OPENAI_MODEL = (process.env.OPENAI_MODEL ?? 'gpt-4o-mini').trim();
const USE_LLM = Boolean(OPENAI_API_KEY);

// helper para validar canal sin que TS se queje
const CHANNELS = ['EMAIL', 'WHATSAPP', 'SMS'] as const;
type Channel = typeof CHANNELS[number];
function isChannel(v: unknown): v is Channel {
    return typeof v === 'string' && (CHANNELS as readonly string[]).includes(v);
}

/** Tiny helper to call OpenAI Chat Completions with JSON output */
async function callOpenAIAsJSON(
    payload: unknown,
    { timeoutMs = 8000 } = {}
): Promise<LlmOutput | null> {
    if (!USE_LLM) return null;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: [
                            'You extract structured reminder data from Spanish or English text.',
                            'Return ONLY a JSON object with optional fields:',
                            '{ "title": string, "dueAtISO": string, "rrule": string,',
                            '  "channel": "EMAIL" | "WHATSAPP" | "SMS", "category": string,',
                            '  "notes": string, "confidence": number }',
                            'Dates must be ISO-8601 in UTC when possible. If unsure, omit the field.',
                        ].join(' '),
                    },
                    { role: 'user', content: JSON.stringify(payload) },
                ],
            }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const content: string = data?.choices?.[0]?.message?.content ?? '{}';

        // Defensive parse
        const obj = JSON.parse(content) as Record<string, unknown>;

        // Narrow to LlmOutput safely
        const out: LlmOutput = {};
        if (typeof obj.title === 'string') out.title = obj.title;
        if (typeof obj.dueAtISO === 'string') out.dueAtISO = obj.dueAtISO;
        if (typeof obj.rrule === 'string') out.rrule = obj.rrule;
        if (isChannel(obj.channel)) {
            out.channel = obj.channel;
        }
        if (typeof obj.category === 'string') out.category = obj.category;
        if (typeof obj.notes === 'string') out.notes = obj.notes;
        if (typeof obj.confidence === 'number') out.confidence = obj.confidence;

        return out;
    } catch {
        return null;
    } finally {
        clearTimeout(id);
    }
}

/** Baseline heuristic parser (chrono + simple rules) */
function heuristicParse(input: ParseInput): ParseOutput {
    const chronoRes = chrono.parse(input.text, new Date(), { forwardDate: true });
    const first = chronoRes[0];

    let dueAtISO: string | undefined;
    if (first?.start) dueAtISO = first.start.date().toISOString();

    const lower = input.text.toLowerCase();

    const channel: ParseOutput['channel'] =
        lower.includes('whatsapp') ? 'WHATSAPP'
            : lower.includes('sms') ? 'SMS'
                : 'EMAIL';

    const category =
        /(telcel|teléfono|celular|saldo)/.test(lower) ? 'telco' :
            /(internet|izzi|totalplay|claro|telmex)/.test(lower) ? 'internet' :
                /(colegiatura|escuela|universidad)/.test(lower) ? 'colegiatura' :
                    /(renta|alquiler)/.test(lower) ? 'renta' :
                        /(imss|sat|ine|trámite|gobierno)/.test(lower) ? 'gov' :
                            undefined;

    const title = (input.text.match(/^[^\n]{3,60}/)?.[0] ?? 'Reminder').trim();

    const output: ParseOutput = {
        title,
        channel,
        confidence: first ? 0.8 : 0.5,
        notes: 'chrono-baseline',
        ...(dueAtISO && { dueAtISO }),
        ...(category && { category }),
    };

    return output;
}

/** Merge: LLM overrides heuristic where it provided values */
function mergeOutputs(base: ParseOutput, llm: LlmOutput | null): ParseOutput {
    if (!llm) return base;

    const merged: ParseOutput = {
        ...base,
        ...(llm.title ? { title: llm.title } : null),
        ...(llm.dueAtISO ? { dueAtISO: llm.dueAtISO } : null),
        ...(llm.rrule ? { rrule: llm.rrule } : null),
        ...(llm.channel ? { channel: llm.channel } : null),
        ...(llm.category ? { category: llm.category } : null),
        ...(llm.notes ? { notes: llm.notes } : null),
    };

    const baseConf = base.confidence ?? 0.5;
    const llmConf =
        typeof llm.confidence === 'number' ? llm.confidence : (USE_LLM ? 0.85 : baseConf);
    merged.confidence = Math.max(baseConf, llmConf);

    return merged;
}

export async function parseReminder(input: ParseInput): Promise<ParseOutput> {
    const baseline = heuristicParse(input);
    if (!USE_LLM) return baseline;

    const llm = await callOpenAIAsJSON({ text: input.text, tz: input.tz });
    return mergeOutputs(baseline, llm);
}
