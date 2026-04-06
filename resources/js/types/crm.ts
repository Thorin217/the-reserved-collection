import type { User } from './auth';

export type Client = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    document_type: 'rut' | 'passport' | 'other' | null;
    document_number: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    leads_count?: number;
    created_at: string;
    updated_at: string;
};

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'negotiating' | 'won' | 'lost';
export type LeadSource = 'referral' | 'web' | 'social' | 'walk_in' | 'other';

export type Lead = {
    id: number;
    title: string;
    status: LeadStatus;
    source: LeadSource;
    product_interest: string | null;
    expected_value: string | null;
    notes: string | null;
    closed_at: string | null;
    client?: Client;
    assigned_user?: User;
    interactions_count?: number;
    created_at: string;
    updated_at: string;
};

export type LeadInteraction = {
    id: number;
    lead_id: number;
    type: 'call' | 'email' | 'visit' | 'whatsapp' | 'other';
    notes: string;
    interacted_at: string;
    user?: User;
    created_at: string;
};
