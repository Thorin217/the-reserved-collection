import { Head, Link, router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    Gauge,
    Gem,
    Lock,
    MessageSquare,
    SendHorizonal,
    ShieldCheck,
    Sparkles,
    Wrench,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { myCollection } from '@/routes/portal';
import { pay as payServiceRequest, store as storeServiceRequest, cancel as cancelServiceRequest } from '@/routes/portal/service-requests';
import { store as storeMessage } from '@/routes/portal/service-requests/messages';

const SERVICE_CATALOG = [
    { value: 'full_restoration', title: 'Full Restoration', icon: Wrench, desc: 'Complete mechanical overhaul by master watchmakers with factory-grade components.' },
    { value: 'authentication_and_appraisal', title: 'Authentication & Appraisal', icon: ShieldCheck, desc: 'Expert verification with provenance reports and current market valuation.' },
    { value: 'preventive_care', title: 'Preventive Care', icon: Clock, desc: 'Routine servicing to maintain optimal performance and longevity.' },
    { value: 'crystal_polishing', title: 'Crystal Polishing', icon: Sparkles, desc: 'Precision crystal replacement and polishing for pristine clarity.' },
    { value: 'pressure_testing', title: 'Pressure Testing', icon: Gauge, desc: 'Water resistance verification to manufacturer specifications.' },
    { value: 'custom_setting', title: 'Custom Setting', icon: Gem, desc: 'Bespoke jewelry design and diamond setting by trained artisans.' },
];

const STATUS_CONFIG: Record<string, { icon: typeof Calendar; color: string; bg: string }> = {
    scheduled: { icon: Calendar, color: 'text-gold', bg: 'bg-gold/10' },
    in_progress: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    cancelled: { icon: X, color: 'text-muted-foreground', bg: 'bg-muted/10' },
};

type Message = {
    id: number;
    message: string;
    is_admin: boolean;
    sender_name: string;
    created_at: string;
};

type ServiceRequest = {
    id: number;
    service_type: string;
    service_type_label: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    notes: string | null;
    internal_notes: string | null;
    created_at: string;
    sale_id: number | null;
    sale: { id: number; sale_number: string; total: number; balance_due: number; status: string } | null;
    sale_item: {
        id: number;
        description: string | null;
        product_variant: { product: { name: string; brand: { name: string } | null } | null } | null;
    } | null;
    messages: Message[];
};

type CollectionItem = { sale_item_id: number; name: string; brand: string | null };
type ServiceTypeOption = { value: string; label: string };

type Props = {
    service_requests: { data: ServiceRequest[] };
    collection_items: CollectionItem[];
    has_collection: boolean;
    service_types: ServiceTypeOption[];
};

export default function ServiceRequestsIndex({ service_requests, collection_items, has_collection, service_types }: Props) {
    const requests = service_requests.data;
    const hasRequests = requests.length > 0;
    const [showModal, setShowModal] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [payingRequest, setPayingRequest] = useState<ServiceRequest | null>(null);

    const scheduleForm = useForm({
        sale_item_id: (collection_items[0]?.sale_item_id ?? '') as string | number,
        service_type: service_types[0]?.value ?? '',
        scheduled_at: '',
        notes: '',
    });

    const msgForm = useForm({ message: '' });

    const payForm = useForm({
        card_name: '',
        card_number: '',
        card_expiry: '',
        card_cvv: '',
    });

    function openModal() { setShowModal(true); }
    function closeModal() { setShowModal(false); scheduleForm.reset(); }

    function handleScheduleSubmit(e: React.FormEvent) {
        e.preventDefault();
        scheduleForm.post(storeServiceRequest(), { onSuccess: () => closeModal() });
    }

    function sendMessage(req: ServiceRequest) {
        msgForm.post(storeMessage(req), {
            onSuccess: () => msgForm.reset(),
        });
    }

    function handleCardNumber(e: React.ChangeEvent<HTMLInputElement>) {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
        payForm.setData('card_number', digits.replace(/(.{4})/g, '$1 ').trim());
    }

    function handleExpiry(e: React.ChangeEvent<HTMLInputElement>) {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
        payForm.setData('card_expiry', digits.length >= 3 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits);
    }

    function submitPayment(e: React.FormEvent) {
        e.preventDefault();
        if (!payingRequest) return;
        payForm.post(payServiceRequest(payingRequest), {
            onSuccess: () => { setPayingRequest(null); payForm.reset(); },
        });
    }

    return (
        <>
            <Head title="Concierge Services — The Reserved Collection" />

            <section className="bg-background py-10">
                <div className="container mx-auto px-6">
                    <FlashMessage />

                    {!hasRequests ? (
                        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-2">
                            <div className="lg:sticky lg:top-28">
                                <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                                    Concierge Services
                                </p>
                                <h1 className="font-display text-2xl font-light leading-tight text-foreground md:text-3xl line-ornament">
                                    Atelier & Maintenance
                                </h1>
                                <p className="mt-5 max-w-xs font-body text-xs font-light leading-relaxed text-muted-foreground">
                                    Our in-house atelier provides the highest standard of care.
                                    Every piece is treated with the reverence it deserves.
                                </p>
                                {has_collection ? (
                                    <button onClick={openModal} className="mt-6 inline-block border border-gold/40 px-6 py-2.5 font-body text-[10px] font-medium tracking-[0.15em] text-gold uppercase transition-all duration-300 hover:bg-gold hover:text-accent-foreground">
                                        Book a Consultation
                                    </button>
                                ) : (
                                    <Link href={myCollection()} className="mt-6 inline-block border border-border px-6 py-2.5 font-body text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase transition-all duration-300 hover:border-gold/40 hover:text-gold">
                                        View My Collection
                                    </Link>
                                )}
                            </div>

                            <div className="space-y-4">
                                {SERVICE_CATALOG.map((svc, i) => {
                                    const Icon = svc.icon;
                                    return (
                                        <motion.div key={svc.value} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }} className="flex gap-5 border border-border bg-card p-5 transition-all duration-300 hover:border-gold/25">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/20 text-gold">
                                                <Icon className="h-4 w-4" strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <h3 className="mb-1.5 font-display text-base text-foreground">{svc.title}</h3>
                                                <p className="font-body text-[11px] font-light leading-relaxed text-muted-foreground">{svc.desc}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">Concierge Services</p>
                                    <h1 className="font-display text-2xl font-light text-foreground md:text-3xl">My Service Requests</h1>
                                </div>
                                {has_collection && (
                                    <button onClick={openModal} className="border border-gold/40 px-6 py-2.5 font-body text-[9px] tracking-[0.2em] text-gold uppercase transition-all duration-300 hover:bg-gold/5">
                                        + New Request
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {requests.map((req, i) => {
                                    const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.scheduled;
                                    const Icon = cfg.icon;
                                    const svcCatalog = SERVICE_CATALOG.find((s) => s.value === req.service_type);
                                    const SvcIcon = svcCatalog?.icon ?? Wrench;
                                    const itemName = req.sale_item?.product_variant?.product?.name ?? req.sale_item?.description ?? null;
                                    const brandName = req.sale_item?.product_variant?.product?.brand?.name ?? null;
                                    const isExpanded = expandedId === req.id;

                                    return (
                                        <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.35 }} className="border border-border bg-card">
                                            {/* Card header */}
                                            <div className="p-5">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-gold/20">
                                                            <SvcIcon className="h-4 w-4 text-gold" strokeWidth={1.5} />
                                                        </div>
                                                        <div>
                                                            <p className="font-display text-base font-light text-foreground">{req.service_type_label}</p>
                                                            {itemName && (
                                                                <p className="font-body text-xs text-muted-foreground">
                                                                    {brandName ? `${brandName} · ` : ''}{itemName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {req.messages.length > 0 && (
                                                            <button
                                                                onClick={() => setExpandedId(isExpanded ? null : req.id)}
                                                                className="flex items-center gap-1.5 font-body text-[9px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-gold"
                                                            >
                                                                <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
                                                                {req.messages.length}
                                                            </button>
                                                        )}
                                                        <div className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 ${cfg.bg}`}>
                                                            <Icon className={`h-3 w-3 ${cfg.color}`} strokeWidth={1.5} />
                                                            <span className={`font-body text-[10px] ${cfg.color}`}>{req.status_label}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4">
                                                    <div>
                                                        <p className="font-body text-[9px] tracking-[0.15em] text-muted-foreground uppercase">Preferred Date</p>
                                                        <p className="mt-0.5 font-body text-xs text-foreground">{req.scheduled_at}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-body text-[9px] tracking-[0.15em] text-muted-foreground uppercase">Submitted</p>
                                                        <p className="mt-0.5 font-body text-xs text-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                {req.notes && (
                                                    <p className="mt-3 font-body text-xs text-muted-foreground italic">"{req.notes}"</p>
                                                )}

                                                {/* Invoice bar — only when admin has confirmed/sent the invoice */}
                                                {req.sale && req.sale.status === 'confirmed' && req.sale.total > 0 && (
                                                    <div className="mt-4 flex items-center justify-between border border-border bg-muted/30 px-4 py-3">
                                                        <div>
                                                            <p className="font-body text-[9px] tracking-[0.15em] text-muted-foreground uppercase">
                                                                Invoice · {req.sale.sale_number}
                                                            </p>
                                                            <p className="mt-0.5 font-body text-xs text-foreground">
                                                                Total: <span className="font-medium">{formatCurrency(req.sale.total)}</span>
                                                                {req.sale.balance_due > 0
                                                                    ? <> · <span className="text-gold">Due: {formatCurrency(req.sale.balance_due)}</span></>
                                                                    : <> · <span className="text-green-500">Paid ✓</span></>
                                                                }
                                                            </p>
                                                        </div>
                                                        {req.sale.balance_due > 0 && (
                                                            <button
                                                                onClick={() => setPayingRequest(req)}
                                                                className="flex items-center gap-1.5 border border-gold/40 px-4 py-1.5 font-body text-[9px] tracking-[0.15em] text-gold uppercase transition-all hover:bg-gold hover:text-accent-foreground"
                                                            >
                                                                <CreditCard className="h-3 w-3" strokeWidth={1.5} />
                                                                Pay Now
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Cancel button */}
                                                {req.status !== 'completed' && req.status !== 'cancelled' && (
                                                    <div className="mt-3 flex justify-end">
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to cancel this service request?')) {
                                                                    router.post(cancelServiceRequest(req).url);
                                                                }
                                                            }}
                                                            className="font-body text-[9px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-destructive"
                                                        >
                                                            Cancel Request
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Toggle to open thread */}
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                                                    className="mt-3 flex w-full items-center justify-center gap-1.5 border-t border-border pt-3 font-body text-[9px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-gold"
                                                >
                                                    <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
                                                    {isExpanded ? 'Close Messages' : `Messages${req.messages.length > 0 ? ` (${req.messages.length})` : ''}`}
                                                </button>
                                            </div>

                                            {/* Thread */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="overflow-hidden border-t border-border"
                                                    >
                                                        <div className="space-y-0 bg-muted/20 px-5 py-4">
                                                            {req.messages.length === 0 && (
                                                                <p className="py-4 text-center font-body text-[11px] text-muted-foreground">
                                                                    No messages yet. Start the conversation below.
                                                                </p>
                                                            )}

                                                            {req.messages.map((msg) => (
                                                                <div
                                                                    key={msg.id}
                                                                    className={`flex gap-3 py-3 ${msg.is_admin ? '' : 'flex-row-reverse'}`}
                                                                >
                                                                    {/* Avatar */}
                                                                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-medium ${msg.is_admin ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'}`}>
                                                                        {msg.sender_name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className={`max-w-[80%] ${msg.is_admin ? '' : 'items-end'} flex flex-col`}>
                                                                        <div className={`rounded-sm px-3 py-2 font-body text-xs ${msg.is_admin ? 'border border-gold/20 bg-card text-foreground' : 'bg-muted text-foreground'}`}>
                                                                            {msg.is_admin && (
                                                                                <p className="mb-1 font-body text-[8px] tracking-[0.15em] text-gold uppercase">
                                                                                    The Reserved Collection
                                                                                </p>
                                                                            )}
                                                                            <p>{msg.message}</p>
                                                                        </div>
                                                                        <p className="mt-1 font-body text-[9px] text-muted-foreground">
                                                                            {new Date(msg.created_at).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* Reply input */}
                                                            <div className="flex gap-2 border-t border-border pt-3">
                                                                <textarea
                                                                    value={msgForm.data.message}
                                                                    onChange={(e) => msgForm.setData('message', e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            sendMessage(req);
                                                                        }
                                                                    }}
                                                                    rows={2}
                                                                    placeholder="Type a message... (Enter to send)"
                                                                    className="flex-1 border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none resize-none"
                                                                />
                                                                <button
                                                                    onClick={() => sendMessage(req)}
                                                                    disabled={msgForm.processing || !msgForm.data.message}
                                                                    className="flex h-auto items-center justify-center border border-gold/40 px-3 text-gold transition-all hover:bg-gold hover:text-accent-foreground disabled:opacity-40"
                                                                >
                                                                    <SendHorizonal className="h-3.5 w-3.5" strokeWidth={1.5} />
                                                                </button>
                                                            </div>
                                                            {msgForm.errors.message && (
                                                                <p className="text-xs text-destructive">{msgForm.errors.message}</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Book service modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={closeModal}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm border border-border bg-card p-6">
                            <div className="mb-5 flex items-center justify-between">
                                <h3 className="font-display text-lg text-foreground">Schedule Service</h3>
                                <button onClick={closeModal} className="text-muted-foreground transition-colors hover:text-foreground">
                                    <X className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                            </div>

                            <form onSubmit={handleScheduleSubmit} className="space-y-4">
                                {collection_items.length > 1 && (
                                    <div>
                                        <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Item</label>
                                        <select value={scheduleForm.data.sale_item_id} onChange={(e) => scheduleForm.setData('sale_item_id', Number(e.target.value))} className="w-full border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none">
                                            {collection_items.map((item) => (
                                                <option key={item.sale_item_id} value={item.sale_item_id}>
                                                    {item.brand ? `${item.brand} · ` : ''}{item.name}
                                                </option>
                                            ))}
                                        </select>
                                        {scheduleForm.errors.sale_item_id && <p className="mt-1 text-xs text-destructive">{scheduleForm.errors.sale_item_id}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Service Type</label>
                                    <select value={scheduleForm.data.service_type} onChange={(e) => scheduleForm.setData('service_type', e.target.value)} className="w-full border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none">
                                        {service_types.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                    {scheduleForm.errors.service_type && <p className="mt-1 text-xs text-destructive">{scheduleForm.errors.service_type}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Preferred Date</label>
                                    <input type="date" value={scheduleForm.data.scheduled_at} onChange={(e) => scheduleForm.setData('scheduled_at', e.target.value)} className="w-full border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none" />
                                    {scheduleForm.errors.scheduled_at && <p className="mt-1 text-xs text-destructive">{scheduleForm.errors.scheduled_at}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Notes (optional)</label>
                                    <textarea value={scheduleForm.data.notes} onChange={(e) => scheduleForm.setData('notes', e.target.value)} rows={2} placeholder="Any specific requests or concerns..." className="w-full border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none" />
                                    {scheduleForm.errors.notes && <p className="mt-1 text-xs text-destructive">{scheduleForm.errors.notes}</p>}
                                </div>

                                <button type="submit" disabled={scheduleForm.processing || !scheduleForm.data.scheduled_at} className="w-full bg-gold py-2.5 font-body text-[10px] font-medium tracking-[0.15em] text-accent-foreground uppercase transition-all duration-300 hover:bg-gold-dark disabled:opacity-40">
                                    {scheduleForm.processing ? 'Submitting...' : 'Confirm Booking'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment modal */}
            <AnimatePresence>
                {payingRequest && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setPayingRequest(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm border border-border bg-card p-6">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h3 className="font-display text-lg text-foreground">Pay Service Invoice</h3>
                                    {payingRequest.sale && (
                                        <p className="font-body text-xs text-gold">{formatCurrency(payingRequest.sale.balance_due)} due</p>
                                    )}
                                </div>
                                <button onClick={() => setPayingRequest(null)} className="text-muted-foreground transition-colors hover:text-foreground">
                                    <X className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                            </div>

                            <form onSubmit={submitPayment} className="space-y-3">
                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Cardholder Name</label>
                                    <input type="text" value={payForm.data.card_name} onChange={(e) => payForm.setData('card_name', e.target.value)} placeholder="As it appears on the card" className="w-full border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none" />
                                    {payForm.errors.card_name && <p className="mt-1 text-xs text-destructive">{payForm.errors.card_name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Card Number</label>
                                    <input type="text" value={payForm.data.card_number} onChange={handleCardNumber} placeholder="0000 0000 0000 0000" inputMode="numeric" maxLength={19} className="w-full border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground focus:border-gold/40 focus:outline-none" />
                                    {payForm.errors.card_number && <p className="mt-1 text-xs text-destructive">{payForm.errors.card_number}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Expiry</label>
                                        <input type="text" value={payForm.data.card_expiry} onChange={handleExpiry} placeholder="MM/YY" maxLength={5} inputMode="numeric" className="w-full border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground focus:border-gold/40 focus:outline-none" />
                                        {payForm.errors.card_expiry && <p className="mt-1 text-xs text-destructive">{payForm.errors.card_expiry}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">CVV</label>
                                        <input type="password" value={payForm.data.card_cvv} onChange={(e) => payForm.setData('card_cvv', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="•••" maxLength={4} inputMode="numeric" className="w-full border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground focus:border-gold/40 focus:outline-none" />
                                        {payForm.errors.card_cvv && <p className="mt-1 text-xs text-destructive">{payForm.errors.card_cvv}</p>}
                                    </div>
                                </div>
                                <button type="submit" disabled={payForm.processing} className="mt-1 flex h-10 w-full items-center justify-center gap-2 bg-gold font-body text-[9px] tracking-[0.2em] text-accent-foreground uppercase transition-all hover:bg-gold-dark disabled:opacity-40">
                                    <Lock className="h-3 w-3" strokeWidth={2} />
                                    {payForm.processing ? 'Processing...' : `Pay ${payingRequest.sale ? formatCurrency(payingRequest.sale.balance_due) : ''}`}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

ServiceRequestsIndex.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
