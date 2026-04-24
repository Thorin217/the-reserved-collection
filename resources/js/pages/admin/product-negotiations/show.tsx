import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, DollarSign, MessageSquare, Package, User } from 'lucide-react';
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
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { index as negotiationsIndex, update as negotiationUpdate } from '@/routes/admin/product-negotiations';
import { store as storeMessage } from '@/routes/admin/product-negotiations/messages';
import type { ProductNegotiation, ProductNegotiationMessage } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: 'Pending Review', variant: 'secondary' },
    active: { label: 'Active', variant: 'default' },
    agreed: { label: 'Agreed', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'outline' },
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
    offer: 'Client Offer',
    counter_offer: 'Counter Offer',
    note: 'Note',
};

function fmt(value: string | null | undefined): string {
    if (!value) return '—';
    return formatCurrency(value);
}

function MessageBubble({ msg, authUserId }: { msg: ProductNegotiationMessage; authUserId: number }) {
    const isAdmin = msg.user_id === authUserId;
    const isOffer = msg.type === 'offer' || msg.type === 'counter_offer';

    return (
        <div className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                {isOffer ? <DollarSign className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
            <div className={`max-w-[70%] space-y-1 ${isAdmin ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{msg.user?.name ?? 'Unknown'}</span>
                    <span>·</span>
                    <span>{MESSAGE_TYPE_LABELS[msg.type] ?? msg.type}</span>
                    <span>·</span>
                    <span>{new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div className={`rounded-lg border px-4 py-2 ${isAdmin ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
                    {msg.amount && (
                        <p className="font-mono text-lg font-bold">{fmt(msg.amount)}</p>
                    )}
                    {msg.message && (
                        <p className="text-sm text-foreground">{msg.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

type Props = {
    negotiation: { data: ProductNegotiation };
};

export default function ProductNegotiationShow({ negotiation: { data: negotiation } }: Props) {
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const isOpen = negotiation.status === 'pending' || negotiation.status === 'active';
    const statusConf = STATUS_CONFIG[negotiation.status] ?? STATUS_CONFIG.pending;

    const messageForm = useForm({
        type: 'counter_offer' as 'offer' | 'counter_offer' | 'note',
        amount: '',
        message: '',
    });

    const statusForm = useForm({
        status: negotiation.status,
        final_price: negotiation.final_price ?? '',
        notes: negotiation.notes ?? '',
    });

    function submitMessage(e: React.FormEvent) {
        e.preventDefault();
        messageForm.post(storeMessage.url(negotiation), {
            onSuccess: () => messageForm.reset(),
        });
    }

    function submitStatus(e: React.FormEvent) {
        e.preventDefault();
        statusForm.put(negotiationUpdate.url(negotiation), {
            onSuccess: () => setUpdatingStatus(false),
        });
    }

    return (
        <>
            <Head title={`Negotiation #${negotiation.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center gap-3">
                    <Link href={negotiationsIndex()} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">Negotiation #{negotiation.id}</h1>
                            <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {negotiation.product?.brand && `${negotiation.product.brand.name} — `}
                            {negotiation.product?.name}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Left: message thread + reply form */}
                    <div className="space-y-4 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Negotiation Thread
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Initial offer banner */}
                                <div className="flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm">
                                    <span className="text-muted-foreground">Client's initial offer</span>
                                    <span className="font-mono font-semibold">{fmt(negotiation.initial_offer)}</span>
                                </div>

                                {(!negotiation.messages || negotiation.messages.length === 0) ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No messages yet. Start the negotiation below.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {negotiation.messages.map((msg, i) => (
                                            <div key={msg.id}>
                                                {i > 0 && <Separator className="mb-4" />}
                                                <MessageBubble msg={msg} authUserId={0} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Agreed price */}
                                {negotiation.status === 'agreed' && negotiation.final_price && (
                                    <div className="flex items-center justify-between rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3">
                                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Agreed Price</span>
                                        <span className="font-mono text-lg font-bold text-green-700 dark:text-green-400">{fmt(negotiation.final_price)}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reply form */}
                        {isOpen && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Send Response</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={submitMessage} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label>Type</Label>
                                                <Select
                                                    value={messageForm.data.type}
                                                    onValueChange={(v) => messageForm.setData('type', v as typeof messageForm.data.type)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="counter_offer">Counter Offer</SelectItem>
                                                        <SelectItem value="note">Note / Message</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {messageForm.data.type === 'counter_offer' && (
                                                <div className="space-y-1.5">
                                                    <Label>Counter offer amount</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={messageForm.data.amount}
                                                        onChange={(e) => messageForm.setData('amount', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                    {messageForm.errors.amount && (
                                                        <p className="text-xs text-destructive">{messageForm.errors.amount}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Message</Label>
                                            <Textarea
                                                value={messageForm.data.message}
                                                onChange={(e) => messageForm.setData('message', e.target.value)}
                                                placeholder="Write a message to the client..."
                                                rows={3}
                                            />
                                        </div>
                                        <Button type="submit" disabled={messageForm.processing}>
                                            {messageForm.processing ? 'Sending…' : 'Send Response'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right sidebar: details + status management */}
                    <div className="space-y-4">
                        {/* Product info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Package className="h-4 w-4" />
                                    Product
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {negotiation.product?.image_url && (
                                    <img
                                        src={negotiation.product.image_url as string}
                                        alt={negotiation.product.name}
                                        className="mb-3 aspect-square w-full rounded-md object-cover"
                                    />
                                )}
                                {negotiation.product?.brand && (
                                    <p className="text-xs text-muted-foreground">{negotiation.product.brand.name}</p>
                                )}
                                <p className="font-medium">{negotiation.product?.name}</p>
                                <p className="text-xs text-muted-foreground">SKU: {negotiation.product?.sku}</p>
                            </CardContent>
                        </Card>

                        {/* Collector info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4" />
                                    Collector
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <p className="font-medium">{negotiation.user?.name}</p>
                                <p className="text-muted-foreground">{negotiation.user?.email}</p>
                                <p className="text-xs text-muted-foreground">
                                    Submitted {new Date(negotiation.created_at).toLocaleDateString()}
                                </p>
                                {negotiation.notes && (
                                    <div className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                        {negotiation.notes}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status management */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Update Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!updatingStatus ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            Current: <Badge variant={statusConf.variant} className="ml-1">{statusConf.label}</Badge>
                                        </p>
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => setUpdatingStatus(true)}>
                                            Change Status
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={submitStatus} className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label>Status</Label>
                                            <Select
                                                value={statusForm.data.status}
                                                onValueChange={(v) => statusForm.setData('status', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending Review</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="agreed">Agreed</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {statusForm.data.status === 'agreed' && (
                                            <div className="space-y-1.5">
                                                <Label>Agreed price</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={statusForm.data.final_price}
                                                    onChange={(e) => statusForm.setData('final_price', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <Label>Notes</Label>
                                            <Textarea
                                                value={statusForm.data.notes}
                                                onChange={(e) => statusForm.setData('notes', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm" disabled={statusForm.processing}>
                                                {statusForm.processing ? 'Saving…' : 'Save'}
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setUpdatingStatus(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

ProductNegotiationShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Portal Negotiations', href: '' },
            { title: 'Negotiation Detail', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
