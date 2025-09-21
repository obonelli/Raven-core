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

export async function parseReminder(input: ParseInput): Promise<ParseOutput> {
    const chronoRes = chrono.parse(input.text, new Date(), { forwardDate: true });
    const first = chronoRes[0];

    let dueAtISO: string | undefined;
    if (first?.start) dueAtISO = first.start.date().toISOString();

    // heurísticas simples (luego las refinamos con LLM)
    const lower = input.text.toLowerCase();
    const channel: 'EMAIL' | 'WHATSAPP' | 'SMS' =
        lower.includes('whatsapp') ? 'WHATSAPP' : 'EMAIL';

    const category =
        /(telcel|teléfono|celular|saldo)/.test(lower) ? 'telco' :
            /(internet|izzi|totalplay)/.test(lower) ? 'internet' :
                /(colegiatura|escuela)/.test(lower) ? 'colegiatura' :
                    /(renta|alquiler)/.test(lower) ? 'renta' :
                        /(imss|sat|ine|trámite|gobierno)/.test(lower) ? 'gov' :
                            undefined;

    const title = (input.text.match(/^[^\n]{3,60}/)?.[0] ?? 'Reminder').trim();

    // Construimos el output sin empujar `undefined` en props opcionales
    const output: ParseOutput = {
        title,
        channel, // opcional en el tipo, pero válido incluirlo siempre
        confidence: first ? 0.8 : 0.5,
        notes: 'chrono-only',
        ...(dueAtISO && { dueAtISO }),
        ...(category && { category }),
        // rrule vendrá vacío aquí; si algún día lo calculamos, agregar spread similar
    };

    return output;
}
