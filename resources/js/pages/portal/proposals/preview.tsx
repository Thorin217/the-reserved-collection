import { Head } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { useEffect } from 'react';
import type { Lead, LeadProposal, LeadProposalItem } from '@/types';

function fmt(value: string | null | undefined): string {
    if (!value) { return '—'; }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

function ItemRow({ item }: { item: LeadProposalItem }) {
    const imageUrl = item.product?.image_url;

    return (
        <div className="flex gap-5 border-b border-border py-6 last:border-0">
            <div className="h-20 w-20 shrink-0 overflow-hidden border border-border bg-secondary">
                {imageUrl ? (
                    <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Package className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-display text-base text-foreground">{item.name}</h3>
                        {item.model && <p className="font-body text-sm text-muted-foreground">{item.model}</p>}
                        {item.product?.brand && (
                            <p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">{item.product.brand.name}</p>
                        )}
                    </div>
                    <p className="shrink-0 font-display text-lg font-light text-gold">{fmt(item.suggested_price)}</p>
                </div>
                {item.description && (
                    <p className="font-body text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                )}
                {item.serial && (
                    <p className="font-body text-xs text-muted-foreground/50">
                        Serial: <span className="font-mono">{item.serial.serial_number}</span>
                    </p>
                )}
            </div>
        </div>
    );
}

type Props = {
    proposal: { data: LeadProposal };
    lead: { data: Lead };
};

export default function ProposalPreview({ proposal: { data: proposal }, lead: { data: lead } }: Props) {
    const items = proposal.items ?? [];
    const total = items.reduce((s, i) => s + Number(i.suggested_price), 0);
    const client = lead.client;

    useEffect(() => {
        const html = document.documentElement;
        const wasDark = html.classList.contains('dark');
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
        return () => {
            if (!wasDark) {
                html.classList.remove('dark');
                const stored = localStorage.getItem('appearance') || 'system';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = stored === 'dark' || (stored === 'system' && prefersDark);
                html.style.colorScheme = isDark ? 'dark' : 'light';
            }
        };
    }, []);

    return (
        <>
            <Head title={proposal.title} />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="border-b border-border bg-background/95 backdrop-blur-md">
                    <div className="mx-auto max-w-2xl px-6 py-8">
                        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-gold">The Reserved Collection</p>
                        <h1 className="font-display mt-2 text-2xl font-light text-foreground">{proposal.title}</h1>
                        {client && (
                            <p className="font-body mt-1 text-sm text-muted-foreground">Prepared exclusively for {client.name}</p>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="mx-auto max-w-2xl px-6 py-8">
                    <div className="border border-border bg-card">
                        <div className="px-6">
                            {items.length === 0 ? (
                                <p className="py-12 text-center font-body text-sm text-muted-foreground">No items in this proposal.</p>
                            ) : (
                                items.map((item) => <ItemRow key={item.id} item={item} />)
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="flex items-center justify-between border-t border-border px-6 py-5">
                                <span className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</span>
                                <span className="font-display text-2xl font-light text-gold">{fmt(String(total))}</span>
                            </div>
                        )}
                    </div>

                    {proposal.notes && (
                        <div className="mt-4 border border-border bg-card px-6 py-4">
                            <p className="font-body text-sm italic text-muted-foreground">{proposal.notes}</p>
                        </div>
                    )}

                    <p className="mt-12 text-center font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40">
                        This proposal was prepared exclusively for you · The Reserved Collection
                    </p>
                </div>
            </div>
        </>
    );
}
