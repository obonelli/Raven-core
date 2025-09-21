export type Channel = 'EMAIL' | 'WHATSAPP' | 'SMS';
export type RemStatus = 'QUEUED' | 'ACTIVE' | 'PAUSED' | 'DONE' | 'CANCELED';
export type NotifStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELED';

export interface Reminder {
    id: string;
    userId: string;
    title: string;
    notes?: string | null;
    category?: string | null;
    channel: Channel;
    status: RemStatus;
    dueAt: string;     // ISO
    rrule?: string | null;
    tz: string;
    nlgPayload?: unknown;
    createdAt: string; // ISO
    updatedAt: string; // ISO
}

export interface Notification {
    id: string;
    reminderId: string;
    scheduledAt: string; // ISO
    sentAt?: string | null;
    channel: Channel;
    status: NotifStatus;
    providerId?: string | null;
    error?: string | null;
    createdAt: string;
    updatedAt: string;
}
