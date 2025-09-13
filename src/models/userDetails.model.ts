// src/models/userDetails.model.ts
export interface UserDetails {
    id: string;
    userId: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    zip?: string | null;
    createdAt: string;  // ISO
    updatedAt: string;  // ISO
}
