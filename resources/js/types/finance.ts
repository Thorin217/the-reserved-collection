import type { User } from './auth';
import type { Client, Lead } from './crm';
import type { ProductSerial, ProductVariant } from './inventory';

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
export type FinanceCurrency = 'USD' | 'GTQ';

export type QuoteItem = {
    id: number;
    quote_id: number;
    product_variant_id: number | null;
    product_serial_id: number | null;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    notes: string | null;
    product_variant?: ProductVariant | null;
    product_serial?: ProductSerial | null;
};

export type QuoteCan = {
    update: boolean;
    delete: boolean;
};

export type Quote = {
    id: number;
    client_id: number;
    lead_id: number | null;
    negotiation_id: number | null;
    user_id: number;
    quote_number: string;
    status: QuoteStatus;
    currency: FinanceCurrency;
    issued_at: string | null;
    expires_at: string | null;
    subtotal: string;
    tax_total: string;
    discount_total: string;
    total: string;
    notes: string | null;
    approved_at: string | null;
    items_count?: number;
    client?: Client | null;
    lead?: Lead | null;
    user?: User | null;
    items?: QuoteItem[];
    can?: Partial<QuoteCan>;
    created_at: string;
    updated_at: string;
};
