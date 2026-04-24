import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, DollarSign, MessageSquare, Package, X } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { auctionHouse } from '@/routes/portal';
import { store as storeMessage } from '@/routes/portal/negotiations/messages';
import type { ProductNegotiation, ProductNegotiationMessage } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Pending Review', color: 'text-gold', icon: Clock },
    active: { label: 'In Negotiation', color: 'text-blue-400', icon: MessageSquare },
    agreed: { label: 'Price Agreed', color: 'text-green-500', icon: CheckCircle2 },
    rejected: { label: 'Declined', color: 'text-destructive', icon: X },
    cancelled: { label: 'Cancelled', color: 'text-muted-foreground', icon: X },
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
    offer: 'Your Offer',
    counter_offer: 'Our Counter Offer',
    note: 'Message',
};

function fmt(value: string | null | undefined): string {
    if (!value) return 'N/A';
    return formatCurrency(value);
}

function MessageBubble({ msg, currentUserId }: { msg: ProductNegotiationMessage; currentUserId: number }) {
    const isClient = msg.user_id === currentUserId;
    const isOffer = msg.type === 'offer' || msg.type === 'counter_offer';
    const isCounterOffer = msg.type === 'counter_offer';

    return (
        <div className={`flex gap-3 ${isClient ? 'flex-row-reverse' : ''}`}>
            <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center ${
                    isOffer
                        ? isCounterOffer
                            ? 'bg-gold/20 text-gold'
                            : 'bg-secondary text-foreground/60'
                        : 'bg-secondary text-foreground/40'
                }`}
            >
                {isOffer ? <DollarSign className="h-3 w-3" strokeWidth={1.5} /> : <MessageSquare className="h-3 w-3" strokeWidth={1.5} />}
            </div>
            <div className={`max-w-[72%] space-y-1 ${isClient ? 'items-end text-right' : ''}`}>
                <div className={`flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-wider ${isClient ? 'flex-row-reverse' : ''}`}>
                    <span>{isClient ? 'You' : 'The Reserved'}</span>
                    <span>·</span>
                    <span>{MESSAGE_TYPE_LABELS[msg.type] ?? msg.type}</span>
                    <span>·</span>
                    <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
                <div
                    className={`border px-4 py-3 ${
                        isClient
                            ? 'border-border bg-secondary/50'
                            : isCounterOffer
                              ? 'border-gold/30 bg-gold/5'
                              : 'border-border bg-card'
                    }`}
                >
                    {msg.amount && (
                        <p className={`font-display text-xl ${isCounterOffer ? 'text-gold' : 'text-foreground'}`}>
                            {fmt(msg.amount)}
                        </p>
                    )}
                    {msg.message && (
                        <p className="font-body text-sm leading-relaxed text-foreground/80">{msg.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

type Props = {
    negotiation: { data: ProductNegotiation & { user_id: number } };
};

export default function NegotiationShow({ negotiation: { data: negotiation } }: Props) {
    const statusConf = STATUS_CONFIG[negotiation.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = statusConf.icon;
    const isOpen = negotiation.status === 'pending' || negotiation.status === 'active';

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        message: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(storeMessage.url(negotiation), { onSuccess: () => reset() });
    }

    return (
        <>
            <Head title={`Negotiation — ${negotiation.product?.name ?? 'Product'}`} />

            <div className="pb-16 pt-6">
                <div className="container mx-auto max-w-2xl px-6">
                    {/* Back */}
                    <Link
                        href={auctionHouse({ query: { view: 'negotiation' } }).url}
                        className="mb-8 inline-flex items-center gap-2 font-body text-[10px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-gold"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Live Negotiations
                    </Link>

                    {/* Header */}
                    <div className="mb-6">
                        <p className="mb-1 font-body text-[9px] tracking-[0.3em] text-gold uppercase">Negotiation</p>
                        <h1 className="mb-2 font-display text-2xl text-foreground">
                            {negotiation.product?.brand && `${negotiation.product.brand.name} — `}
                            {negotiation.product?.name}
                        </h1>
                        <div className={`inline-flex items-center gap-1.5 font-body text-[10px] tracking-wider ${statusConf.color}`}>
                            <StatusIcon className="h-3 w-3" strokeWidth={1.5} />
                            {statusConf.label}
                        </div>
                    </div>

                    {/* Initial offer */}
                    <div className="mb-6 flex items-center justify-between border border-border bg-card px-4 py-3">
                        <span className="font-body text-[10px] tracking-wider text-muted-foreground uppercase">Your initial offer</span>
                        <span className="font-display text-lg text-foreground">{fmt(negotiation.initial_offer)}</span>
                    </div>

                    {/* Agreed price */}
                    {negotiation.status === 'agreed' && negotiation.final_price && (
                        <div className="mb-6 flex items-center justify-between border border-gold/30 bg-gold/5 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-gold" strokeWidth={1.5} />
                                <span className="font-body text-[10px] tracking-wider text-gold uppercase">Agreed Price</span>
                            </div>
                            <span className="font-display text-xl text-gold">{fmt(negotiation.final_price)}</span>
                        </div>
                    )}

                    {/* Message thread */}
                    <div className="mb-6 space-y-4">
                        {(!negotiation.messages || negotiation.messages.length === 0) ? (
                            <div className="border border-dashed border-border py-10 text-center">
                                <p className="font-body text-[10px] tracking-wider text-muted-foreground uppercase">
                                    Waiting for our team to respond
                                </p>
                            </div>
                        ) : (
                            negotiation.messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    currentUserId={negotiation.user_id}
                                />
                            ))
                        )}
                    </div>

                    {/* Reply form */}
                    {isOpen && (
                        <div className="border border-border bg-card p-5">
                            <p className="mb-4 font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                Send a message
                            </p>
                            <form onSubmit={submit} className="space-y-3">
                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-wider text-muted-foreground uppercase">
                                        Counter offer amount (optional)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        placeholder="Enter amount..."
                                        className="w-full border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:border-gold focus:outline-none"
                                    />
                                    {errors.amount && <p className="mt-1 font-body text-[10px] text-destructive">{errors.amount}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-wider text-muted-foreground uppercase">
                                        Message *
                                    </label>
                                    <textarea
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Write your message..."
                                        rows={3}
                                        className="w-full resize-none border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:border-gold focus:outline-none"
                                    />
                                    {errors.message && <p className="mt-1 font-body text-[10px] text-destructive">{errors.message}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-gold py-2.5 font-body text-[10px] font-medium tracking-[0.15em] text-accent-foreground uppercase transition-colors hover:bg-gold-dark disabled:opacity-60"
                                >
                                    {processing ? 'Sending…' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Closed states */}
                    {negotiation.status === 'rejected' && (
                        <div className="border border-destructive/20 bg-destructive/5 p-4 text-center">
                            <X className="mx-auto mb-2 h-5 w-5 text-destructive" strokeWidth={1.5} />
                            <p className="font-body text-[10px] tracking-wider text-destructive uppercase">
                                This negotiation was declined
                            </p>
                            {negotiation.notes && (
                                <p className="mt-2 font-body text-xs text-foreground/70">{negotiation.notes}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

NegotiationShow.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
