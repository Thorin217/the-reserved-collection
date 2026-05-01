import { Head, Link, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, Eye, Package, TrendingDown, TrendingUp, Wrench, X } from 'lucide-react';
import { useMemo } from 'react';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { FlashMessage } from '@/components/flash-message';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { store as storeServiceRequest } from '@/routes/portal/service-requests';

type ServiceRequestData = {
    id: number;
    service_type: string;
    service_type_label: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    notes: string | null;
};

type CollectionItem = {
    sale_item_id: number;
    sale_id: number;
    sale_number: string;
    sold_at: string | null;
    name: string;
    brand: string | null;
    unit_price: number;
    image_url: string | null;
    product_slug: string | null;
    service_requests: ServiceRequestData[];
};

type ServiceTypeOption = { value: string; label: string };

type Props = {
    collection_items: CollectionItem[];
    service_types: ServiceTypeOption[];
};

function generateHistory(base: number, points = 30): { d: number; p: number }[] {
    const pts: { d: number; p: number }[] = [];
    let p = base * 0.9;
    for (let i = 0; i < points; i++) {
        p += (Math.random() - 0.45) * base * 0.02;
        p = Math.max(base * 0.75, Math.min(base * 1.15, p));
        pts.push({ d: i, p: Math.round(p) });
    }
    pts[pts.length - 1].p = base;
    return pts;
}

const statusConfig: Record<string, { icon: typeof Calendar; color: string; bg: string }> = {
    scheduled: { icon: Calendar, color: 'text-gold', bg: 'bg-gold/10' },
    in_progress: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    cancelled: { icon: X, color: 'text-muted-foreground', bg: 'bg-muted/10' },
};

export default function MyCollectionPage({ collection_items, service_types }: Props) {
    const [scheduleItemId, setScheduleItemId] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        sale_item_id: '' as string | number,
        service_type: service_types[0]?.value ?? '',
        scheduled_at: '',
        notes: '',
    });

    const itemHistories = useMemo(
        () => Object.fromEntries(collection_items.map((item) => [item.sale_item_id, generateHistory(item.unit_price)])),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const totalValue = collection_items.reduce((s, i) => s + i.unit_price, 0);
    const totalCost = collection_items.reduce((s, i) => s + i.unit_price * 0.92, 0);
    const totalChange = totalValue - totalCost;
    const totalChangePct = totalCost > 0 ? ((totalChange / totalCost) * 100).toFixed(1) : '0.0';
    const isPortfolioUp = totalChange >= 0;

    const portfolioHistory = useMemo(() => {
        const pts: { d: number; p: number }[] = [];
        let p = totalCost * 0.92;
        for (let i = 0; i < 30; i++) {
            p += (Math.random() - 0.42) * totalCost * 0.015;
            p = Math.max(totalCost * 0.85, Math.min(totalValue * 1.05, p));
            pts.push({ d: i, p: Math.round(p) });
        }
        if (pts.length > 0) pts[pts.length - 1].p = totalValue;
        return pts;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function openModal(saleItemId: number) {
        setData('sale_item_id', saleItemId);
        setScheduleItemId(saleItemId);
    }

    function closeModal() {
        setScheduleItemId(null);
        reset();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(storeServiceRequest(), { onSuccess: () => closeModal() });
    }

    const isEmpty = collection_items.length === 0;

    return (
        <>
            <Head title="My Collection — The Reserved Collection" />

            <section className="bg-background py-10">
                <div className="container mx-auto px-6">
                    <FlashMessage />

                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">Personal Vault</p>
                            <h1 className="font-display text-2xl font-light text-foreground md:text-3xl">My Collection</h1>
                        </div>
                    </div>

                    {isEmpty ? (
                        <div className="border border-border bg-card p-12 text-center">
                            <p className="font-display text-lg text-muted-foreground">Your collection is empty.</p>
                            <p className="mt-2 font-body text-sm text-muted-foreground">Items you purchase will appear here.</p>
                        </div>
                    ) : (
                        <>
                            {/* Portfolio overview */}
                            <div className="mb-8 border border-border bg-secondary p-5">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                    <div className="lg:col-span-1">
                                        <p className="mb-1 font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Portfolio Value</p>
                                        <p className="font-display text-3xl text-foreground">{formatCurrency(totalValue)}</p>
                                        <span className={`mt-1 flex items-center gap-1 font-body text-xs ${isPortfolioUp ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPortfolioUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {isPortfolioUp ? '+' : ''}{formatCurrency(Math.abs(totalChange))} ({isPortfolioUp ? '+' : ''}{totalChangePct}%)
                                        </span>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="mb-0.5 font-body text-[9px] tracking-wider text-muted-foreground uppercase">Total Cost</p>
                                                <p className="font-display text-lg text-foreground">{formatCurrency(totalCost)}</p>
                                            </div>
                                            <div>
                                                <p className="mb-0.5 font-body text-[9px] tracking-wider text-muted-foreground uppercase">Pieces</p>
                                                <p className="font-display text-lg text-foreground">{collection_items.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <ResponsiveContainer width="100%" height={140}>
                                            <AreaChart data={portfolioHistory}>
                                                <defs>
                                                    <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor={isPortfolioUp ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                                        <stop offset="100%" stopColor={isPortfolioUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area
                                                    type="monotone"
                                                    dataKey="p"
                                                    stroke={isPortfolioUp ? '#22c55e' : '#ef4444'}
                                                    strokeWidth={2}
                                                    fill="url(#portfolioGrad)"
                                                    dot={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Items grid */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {collection_items.map((item, i) => {
                                    const history = itemHistories[item.sale_item_id] ?? [];
                                    const lastVal = history.length > 0 ? history[history.length - 1].p : item.unit_price;
                                    const isUp = lastVal >= item.unit_price;
                                    const pct = item.unit_price > 0 ? (((lastVal - item.unit_price) / item.unit_price) * 100).toFixed(1) : '0.0';

                                    return (
                                        <motion.div
                                            key={item.sale_item_id}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.06, duration: 0.4 }}
                                            className="group relative border border-border bg-card transition-all duration-300 hover:border-gold/25"
                                        >
                                            {/* Image */}
                                            <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-zinc-800 to-neutral-900">
                                                        {item.brand && (
                                                            <p className="font-body text-[8px] tracking-[0.25em] text-gold/60 uppercase">{item.brand}</p>
                                                        )}
                                                        <Package className="h-8 w-8 text-white/20" strokeWidth={1} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />

                                                {/* Hover overlay actions */}
                                                <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                    {item.product_slug && (
                                                        <Link
                                                            href={`/products/${item.product_slug}`}
                                                            className="flex h-7 w-7 items-center justify-center bg-card/80 text-foreground/60 backdrop-blur-sm transition-colors hover:text-gold"
                                                        >
                                                            <Eye className="h-3 w-3" strokeWidth={1.5} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-3">
                                                <p className="mb-0.5 font-body text-[8px] tracking-[0.2em] text-muted-foreground uppercase">{item.brand}</p>
                                                {item.product_slug ? (
                                                    <Link href={`/products/${item.product_slug}`} className="block">
                                                        <h3 className="mb-2 font-display text-sm leading-tight text-foreground transition-colors hover:text-gold">
                                                            {item.name}
                                                        </h3>
                                                    </Link>
                                                ) : (
                                                    <h3 className="mb-2 font-display text-sm leading-tight text-foreground">{item.name}</h3>
                                                )}

                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="font-body text-sm font-semibold text-foreground">{formatCurrency(item.unit_price)}</span>
                                                    <span className={`flex items-center gap-0.5 font-body text-[10px] ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                                        {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                                        {isUp ? '+' : ''}{pct}%
                                                    </span>
                                                </div>

                                                <ResponsiveContainer width="100%" height={40}>
                                                    <AreaChart data={history}>
                                                        <defs>
                                                            <linearGradient id={`miniGrad-${item.sale_item_id}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.2} />
                                                                <stop offset="100%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Area
                                                            type="monotone"
                                                            dataKey="p"
                                                            stroke={isUp ? '#22c55e' : '#ef4444'}
                                                            strokeWidth={1.5}
                                                            fill={`url(#miniGrad-${item.sale_item_id})`}
                                                            dot={false}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>

                                                {item.sold_at && (
                                                    <p className="mt-1 font-body text-[8px] text-muted-foreground">Acquired {item.sold_at}</p>
                                                )}

                                                {item.service_requests.length > 0 && (
                                                    <div className="mt-2 space-y-1 border-t border-border pt-2">
                                                        {item.service_requests.map((svc) => {
                                                            const cfg = statusConfig[svc.status] ?? statusConfig.scheduled;
                                                            const Icon = cfg.icon;
                                                            return (
                                                                <div key={svc.id} className={`flex items-center gap-1.5 rounded-sm px-2 py-1 ${cfg.bg}`}>
                                                                    <Icon className={`h-2.5 w-2.5 ${cfg.color}`} strokeWidth={1.5} />
                                                                    <span className={`truncate font-body text-[8px] ${cfg.color}`}>{svc.service_type_label}</span>
                                                                    <span className="ml-auto font-body text-[7px] text-muted-foreground">{svc.scheduled_at}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => openModal(item.sale_item_id)}
                                                    className="mt-2 flex w-full items-center justify-center gap-1.5 border border-border py-1.5 font-body text-[9px] tracking-[0.1em] text-muted-foreground uppercase transition-all duration-300 hover:border-gold/40 hover:text-gold"
                                                >
                                                    <Wrench className="h-2.5 w-2.5" strokeWidth={1.5} />
                                                    Schedule Service
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Schedule Service Modal */}
            <AnimatePresence>
                {scheduleItemId !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm border border-border bg-card p-6"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <h3 className="font-display text-lg text-foreground">Schedule Service</h3>
                                <button onClick={closeModal} className="text-muted-foreground transition-colors hover:text-foreground">
                                    <X className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Service Type</label>
                                    <select
                                        value={data.service_type}
                                        onChange={(e) => setData('service_type', e.target.value)}
                                        className="w-full border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none"
                                    >
                                        {service_types.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                    {errors.service_type && <p className="mt-1 text-xs text-destructive">{errors.service_type}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Preferred Date</label>
                                    <input
                                        type="date"
                                        value={data.scheduled_at}
                                        onChange={(e) => setData('scheduled_at', e.target.value)}
                                        className="w-full border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none"
                                    />
                                    {errors.scheduled_at && <p className="mt-1 text-xs text-destructive">{errors.scheduled_at}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Notes (optional)</label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                        placeholder="Any specific requests or concerns..."
                                        className="w-full border border-border bg-secondary px-3 py-2 font-body text-xs text-foreground focus:border-gold/40 focus:outline-none"
                                    />
                                    {errors.notes && <p className="mt-1 text-xs text-destructive">{errors.notes}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !data.scheduled_at}
                                    className="w-full bg-gold py-2.5 font-body text-[10px] font-medium tracking-[0.15em] text-accent-foreground uppercase transition-all duration-300 hover:bg-gold-dark disabled:opacity-40"
                                >
                                    {processing ? 'Submitting...' : 'Confirm Booking'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

MyCollectionPage.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
