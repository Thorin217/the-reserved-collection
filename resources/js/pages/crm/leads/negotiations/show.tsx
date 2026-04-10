import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, ChevronsUpDown, DollarSign, Handshake, XCircle } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { show as leadShow } from '@/routes/admin/leads';
import {
    show as negotiationShow,
    update as negotiationUpdate,
    destroy as negotiationDestroy,
} from '@/routes/admin/leads/negotiations';
import {
    store as storeOffer,
    destroy as destroyOffer,
} from '@/routes/admin/leads/negotiations/offers';
import type { Lead, Negotiation, NegotiationOffer } from '@/types';

const NEGOTIATION_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    negotiating: { label: 'In negotiation', variant: 'default' },
    agreed: { label: 'Agreed', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

const OFFER_TYPE_LABELS: Record<string, string> = {
    our_offer: 'Our offer',
    client_counteroffer: 'Client counteroffer',
};

function fmt(amount: string | null | undefined): string {
    if (!amount) return '—';
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

type Props = {
    lead: { data: Lead };
    negotiation: { data: Negotiation };
};

export default function NegotiationShow({ lead: { data: lead }, negotiation: { data: negotiation } }: Props) {
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const statusConf = NEGOTIATION_STATUS_CONFIG[negotiation.status] ?? NEGOTIATION_STATUS_CONFIG.negotiating;

    const offerForm = useForm({
        type: 'our_offer' as 'our_offer' | 'client_counteroffer',
        amount: '',
        notes: '',
    });

    const statusForm = useForm({
        status: negotiation.status,
        final_price: negotiation.final_price ?? '',
        notes: negotiation.notes ?? '',
    });

    function submitOffer(e: React.FormEvent) {
        e.preventDefault();
        offerForm.post(storeOffer.url({ lead, negotiation }), {
            onSuccess: () => offerForm.reset(),
        });
    }

    function submitStatus(e: React.FormEvent) {
        e.preventDefault();
        statusForm.put(negotiationUpdate.url({ lead, negotiation }), {
            onSuccess: () => setUpdatingStatus(false),
        });
    }

    function deleteOffer(offer: NegotiationOffer) {
        if (!confirm('Remove this offer from the history?')) return;
        router.delete(destroyOffer.url({ lead, negotiation, offer }));
    }

    const isOpen = negotiation.status === 'negotiating';

    return (
        <>
            <Head title={`Negotiation — ${lead.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href={leadShow.url(lead)} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">Negotiation</h1>
                            <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Lead: {lead.title}</p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Left: offer history + add offer */}
                    <div className="space-y-4 lg:col-span-2">

                        {/* Offer history */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ChevronsUpDown className="h-4 w-4" />
                                    Offer history
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Initial price banner */}
                                <div className="mb-4 flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm">
                                    <span className="text-muted-foreground">Starting price</span>
                                    <span className="font-mono font-semibold">{fmt(negotiation.initial_price)}</span>
                                </div>

                                {(!negotiation.offers || negotiation.offers.length === 0) && (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No offers recorded yet.</p>
                                )}

                                <div className="space-y-3">
                                    {negotiation.offers?.map((offer, index) => (
                                        <div key={offer.id}>
                                            {index > 0 && <Separator className="mb-3" />}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                                            offer.type === 'our_offer'
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        <DollarSign className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{OFFER_TYPE_LABELS[offer.type]}</p>
                                                        <p className="font-mono text-lg font-bold leading-tight">{fmt(offer.amount)}</p>
                                                        {offer.notes && (
                                                            <p className="mt-1 text-sm text-muted-foreground">{offer.notes}</p>
                                                        )}
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {offer.user?.name} ·{' '}
                                                            {new Date(offer.created_at).toLocaleDateString('en-US', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isOpen && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={() => deleteOffer(offer)}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {negotiation.final_price && negotiation.status === 'agreed' && (
                                    <div className="mt-4 flex items-center justify-between rounded-md border-2 border-green-500/30 bg-green-500/10 px-4 py-2 text-sm">
                                        <span className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
                                            <CheckCircle className="h-4 w-4" />
                                            Agreed price
                                        </span>
                                        <span className="font-mono text-lg font-bold text-green-700 dark:text-green-400">
                                            {fmt(negotiation.final_price)}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Add offer form */}
                        {isOpen && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add offer</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submitOffer} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Type *</Label>
                                                <Select
                                                    value={offerForm.data.type}
                                                    onValueChange={(v) => offerForm.setData('type', v as 'our_offer' | 'client_counteroffer')}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="our_offer">Our offer</SelectItem>
                                                        <SelectItem value="client_counteroffer">Client counteroffer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Amount *</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={offerForm.data.amount}
                                                    onChange={(e) => offerForm.setData('amount', e.target.value)}
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <Label>Notes</Label>
                                                <Textarea
                                                    value={offerForm.data.notes}
                                                    onChange={(e) => offerForm.setData('notes', e.target.value)}
                                                    rows={2}
                                                    placeholder="Additional context for this offer"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button type="submit" size="sm" disabled={offerForm.processing}>
                                                {offerForm.processing ? 'Saving…' : 'Record offer'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right: summary + close negotiation */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Initial price</span>
                                    <span className="font-mono font-medium">{fmt(negotiation.initial_price)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Offers logged</span>
                                    <span className="font-medium">{negotiation.offers?.length ?? 0}</span>
                                </div>
                                {negotiation.final_price && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Final price</span>
                                        <span className="font-mono font-semibold">{fmt(negotiation.final_price)}</span>
                                    </div>
                                )}
                                {negotiation.agreed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Agreed on</span>
                                        <span>
                                            {new Date(negotiation.agreed_at).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                )}
                                {negotiation.proposal && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">From proposal</span>
                                        <span className="max-w-30 truncate text-right">{negotiation.proposal.title}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Close negotiation */}
                        {isOpen && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Handshake className="h-4 w-4" />
                                        Close negotiation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {!updatingStatus ? (
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={() => {
                                                    statusForm.setData('status', 'agreed');
                                                    setUpdatingStatus(true);
                                                }}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Mark as agreed
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => {
                                                    statusForm.setData('status', 'rejected');
                                                    statusForm.put(negotiationUpdate.url({ lead, negotiation }));
                                                }}
                                                disabled={statusForm.processing}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Mark as rejected
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={submitStatus} className="space-y-3">
                                            <p className="text-sm text-muted-foreground">Enter the final agreed price:</p>
                                            <div className="space-y-1">
                                                <Label>Final price *</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={statusForm.data.final_price}
                                                    onChange={(e) => statusForm.setData('final_price', e.target.value)}
                                                    placeholder="0.00"
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Notes</Label>
                                                <Textarea
                                                    value={statusForm.data.notes}
                                                    onChange={(e) => statusForm.setData('notes', e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={() => setUpdatingStatus(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                    disabled={statusForm.processing}
                                                >
                                                    Confirm
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

NegotiationShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'CRM', href: '#' },
            { title: 'Leads', href: '/admin/leads' },
            { title: 'Detail', href: '#' },
            { title: 'Negotiation', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
