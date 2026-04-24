export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    is_collector_verified?: boolean;
    client?: { id: number; name: string } | null;
    roles?: string[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type CollectorVerificationRequest = {
    id: number;
    user_id: number;
    status: 'pending' | 'approved' | 'rejected';
    message: string | null;
    admin_notes: string | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    reviewer?: User;
};

export type ProductNegotiation = {
    id: number;
    user_id: number;
    product_id: number;
    product_variant_id: number | null;
    status: 'pending' | 'active' | 'agreed' | 'rejected' | 'cancelled';
    initial_offer: string | null;
    final_price: string | null;
    notes: string | null;
    agreed_at: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    product?: { id: number; name: string; sku: string; image_url?: string; brand?: { name: string } | null };
    messages?: ProductNegotiationMessage[];
    messages_count?: number;
};

export type ProductNegotiationMessage = {
    id: number;
    product_negotiation_id: number;
    user_id: number;
    type: 'offer' | 'counter_offer' | 'note';
    amount: string | null;
    message: string | null;
    created_at: string;
    user?: User;
};

export type Auth = {
    user: User;
    isAdmin: boolean;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
