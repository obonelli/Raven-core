export interface User {
    userId: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    googleId?: string | null;
    subscriptionActive?: boolean;
    whatsappNumber?: string | null;
    whatsappVerified?: boolean;
}
