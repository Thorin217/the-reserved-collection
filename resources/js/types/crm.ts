import type { User } from './auth';
import type { Product, ProductVariant, ProductSerial } from './inventory';

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

export type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'won' | 'lost';
export type LeadSource = 'whatsapp' | 'web' | 'referral' | 'social' | 'walk_in' | 'other';

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
    proposals_count?: number;
    negotiations_count?: number;
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

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';

export type LeadProposalItem = {
    id: number;
    lead_proposal_id: number;
    product_id: number;
    product_variant_id: number | null;
    product_serial_id: number | null;
    name: string;
    model: string | null;
    suggested_price: string;
    description: string | null;
    notes: string | null;
    product?: Product;
    variant?: ProductVariant;
    serial?: ProductSerial;
    created_at: string;
};

export type LeadProposal = {
    id: number;
    lead_id: number;
    user_id: number;
    title: string;
    notes: string | null;
    status: ProposalStatus;
    sent_via: 'whatsapp' | 'email' | null;
    sent_at: string | null;
    user?: User;
    items?: LeadProposalItem[];
    items_count?: number;
    created_at: string;
    updated_at: string;
};

export type NegotiationStatus = 'negotiating' | 'agreed' | 'rejected';
export type NegotiationOfferType = 'our_offer' | 'client_counteroffer';

export type NegotiationOffer = {
    id: number;
    negotiation_id: number;
    type: NegotiationOfferType;
    amount: string;
    notes: string | null;
    user?: User;
    created_at: string;
};

export type Negotiation = {
    id: number;
    lead_id: number;
    lead_proposal_id: number | null;
    user_id: number;
    status: NegotiationStatus;
    initial_price: string;
    final_price: string | null;
    notes: string | null;
    agreed_at: string | null;
    user?: User;
    proposal?: LeadProposal;
    offers?: NegotiationOffer[];
    created_at: string;
    updated_at: string;
};
