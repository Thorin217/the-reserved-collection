import { Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bookmark,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    TrendingDown,
    TrendingUp,
    Wrench,
    X,
} from 'lucide-react';
import { useState } from 'react';
import PortalLayout from '@/layouts/portal-layout';

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

function Sparkline({ data, isUp }: { data: { d: number; p: number }[]; isUp: boolean }) {
    const width = 200;
    const height = 40;
    const pad = 2;
    const minP = Math.min(...data.map((d) => d.p));
    const maxP = Math.max(...data.map((d) => d.p));
    const range = maxP - minP || 1;

    const points = data.map((pt, i) => {
        const x = pad + (i / (data.length - 1)) * (width - pad * 2);
        const y = pad + ((maxP - pt.p) / range) * (height - pad * 2);
        return `${x},${y}`;
    });

    const polyline = points.join(' ');
    const lastPt = points[points.length - 1].split(',');
    const fill = `${points.join(' ')} ${lastPt[0]},${height} ${pad},${height}`;

    const stroke = isUp ? '#22c55e' : '#ef4444';
    const fillColor = isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <polygon points={fill} fill={fillColor} />
            <polyline points={polyline} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function PortfolioChart({ data }: { data: { d: number; p: number }[] }) {
    const width = 600;
    const height = 140;
    const pad = 4;
    const minP = Math.min(...data.map((d) => d.p));
    const maxP = Math.max(...data.map((d) => d.p));
    const range = maxP - minP || 1;

    const points = data.map((pt, i) => {
        const x = pad + (i / (data.length - 1)) * (width - pad * 2);
        const y = pad + ((maxP - pt.p) / range) * (height - pad * 2);
        return `${x},${y}`;
    });

    const polyline = points.join(' ');
    const lastPt = points[points.length - 1].split(',');
    const fill = `${points.join(' ')} ${lastPt[0]},${height} ${pad},${height}`;

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={fill} fill="url(#portfolioGrad)" />
            <polyline points={polyline} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

type ServiceStatus = 'scheduled' | 'in-progress' | 'completed';
type ServiceRequest = { id: string; type: string; status: ServiceStatus; date: string };

const serviceTypes = ['Full Restoration', 'Authentication & Appraisal', 'Preventive Care', 'Crystal Polishing', 'Pressure Testing'];

const statusConfig: Record<ServiceStatus, { icon: typeof Calendar; color: string; bg: string; label: string }> = {
    scheduled: { icon: Calendar, color: 'text-gold', bg: 'bg-gold/10', label: 'Scheduled' },
    'in-progress': { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'In Progress' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Completed' },
};

const initialItems = [
    { id: 1, name: 'Submariner Date', brand: 'Rolex', acquired: 'Mar 2025', purchasePrice: 12800, currentValue: 14500, gradient: 'from-green-900 to-emerald-950', history: generateHistory(14500), services: [{ id: 's1', type: 'Preventive Care', status: 'completed' as ServiceStatus, date: '2025-01-15' }] },
    { id: 2, name: 'Royal Oak 15202ST', brand: 'Audemars Piguet', acquired: 'Jan 2025', purchasePrice: 38000, currentValue: 42000, gradient: 'from-amber-900 to-stone-900', history: generateHistory(42000), services: [] as ServiceRequest[] },
    { id: 3, name: 'Diamond Solitaire Pendant', brand: 'Tiffany & Co.', acquired: 'Dec 2024', purchasePrice: 9200, currentValue: 8750, gradient: 'from-zinc-800 to-neutral-900', history: generateHistory(8750), services: [{ id: 's2', type: 'Authentication & Appraisal', status: 'in-progress' as ServiceStatus, date: '2025-02-28' }] },
    { id: 4, name: 'Diamond Tennis Bracelet', brand: 'Bulgari', acquired: 'Nov 2024', purchasePrice: 14500, currentValue: 15800, gradient: 'from-slate-800 to-slate-900', history: generateHistory(15800), services: [] as ServiceRequest[] },
];

const totalValue = initialItems.reduce((s, i) => s + i.currentValue, 0);
const totalCost = initialItems.reduce((s, i) => s + i.purchasePrice, 0);
const totalChange = totalValue - totalCost;
const totalChangePercent = ((totalChange / totalCost) * 100).toFixed(1);
const portfolioHistory = generateHistory(totalValue, 30);

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function MyCollectionPage() {
    const [items, setItems] = useState(initialItems);
    const [scheduleItem, setScheduleItem] = useState<number | null>(null);
    const [selectedService, setSelectedService] = useState(serviceTypes[0]);
    const [selectedDate, setSelectedDate] = useState('');

    function handleSchedule() {
        if (!selectedDate || scheduleItem === null) { return; }
        setItems((prev) =>
            prev.map((item) =>
                item.id === scheduleItem
                    ? { ...item, services: [...item.services, { id: `s-${Date.now()}`, type: selectedService, status: 'scheduled' as ServiceStatus, date: selectedDate }] }
                    : item,
            ),
        );
        setScheduleItem(null);
        setSelectedDate('');
    }

    return (
        <>
            <Head title="My Collection — The Reserved Collection" />

            <section className="py-10 bg-background">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-gold font-body font-light tracking-[0.25em] uppercase text-[10px] mb-2">Personal Vault</p>
                            <h1 className="font-display text-2xl md:text-3xl font-light text-foreground">My Collection</h1>
                        </div>
                        <a href="#" className="text-[10px] font-body font-medium text-gold hover:text-gold-dark transition-colors tracking-[0.15em] uppercase">
                            Manage →
                        </a>
                    </div>

                    {/* Portfolio Overview */}
                    <div className="bg-card border border-border p-5 mb-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-1">Portfolio Value</p>
                                <p className="font-display text-3xl text-foreground mb-1">{formatCurrency(totalValue)}</p>
                                <span className={`flex items-center gap-1 text-xs font-body ${totalChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {totalChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {totalChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalChange))} ({totalChange >= 0 ? '+' : ''}{totalChangePercent}%)
                                </span>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-body mb-0.5">Total Cost</p>
                                        <p className="font-display text-lg text-foreground">{formatCurrency(totalCost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-body mb-0.5">Pieces</p>
                                        <p className="font-display text-lg text-foreground">{items.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2 flex items-end">
                                <PortfolioChart data={portfolioHistory} />
                            </div>
                        </div>
                    </div>

                    {/* Collection Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {items.map((item, i) => {
                            const change = item.currentValue - item.purchasePrice;
                            const pct = ((change / item.purchasePrice) * 100).toFixed(1);
                            const isUp = change >= 0;

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.06, duration: 0.4 }}
                                    className="group relative bg-card border border-border hover:border-gold/25 transition-all duration-300"
                                >
                                    <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-b ${item.gradient}`}>
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <div className="text-center">
                                                <p className="text-[8px] text-gold/60 uppercase tracking-[0.25em] font-body mb-1">{item.brand}</p>
                                                <p className="text-white/80 text-xs font-display font-light">{item.name}</p>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                                        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="w-7 h-7 bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-gold transition-colors">
                                                <Eye className="w-3 h-3" strokeWidth={1.5} />
                                            </button>
                                            <button className="w-7 h-7 bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-gold transition-colors">
                                                <Bookmark className="w-3 h-3" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-0.5">{item.brand}</p>
                                        <h3 className="font-display text-sm text-foreground leading-tight mb-2">{item.name}</h3>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-body font-semibold text-foreground">{formatCurrency(item.currentValue)}</span>
                                            <span className={`flex items-center gap-0.5 text-[10px] font-body ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                                {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                                {isUp ? '+' : ''}{pct}%
                                            </span>
                                        </div>

                                        <Sparkline data={item.history} isUp={isUp} />

                                        <p className="text-[8px] text-muted-foreground font-body mt-1">Acquired {item.acquired}</p>

                                        {/* Service tracking */}
                                        {item.services.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-border space-y-1">
                                                {item.services.map((svc) => {
                                                    const cfg = statusConfig[svc.status];
                                                    const Icon = cfg.icon;
                                                    return (
                                                        <div key={svc.id} className={`flex items-center gap-1.5 px-2 py-1 ${cfg.bg} rounded-sm`}>
                                                            <Icon className={`w-2.5 h-2.5 ${cfg.color}`} strokeWidth={1.5} />
                                                            <span className={`text-[8px] font-body ${cfg.color} truncate`}>{svc.type}</span>
                                                            <span className="text-[7px] text-muted-foreground font-body ml-auto">{svc.date}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setScheduleItem(item.id)}
                                            className="mt-2 w-full flex items-center justify-center gap-1.5 border border-border hover:border-gold/40 text-muted-foreground hover:text-gold py-1.5 text-[9px] font-body tracking-[0.1em] uppercase transition-all duration-300"
                                        >
                                            <Wrench className="w-2.5 h-2.5" strokeWidth={1.5} />
                                            Schedule Service
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-6 text-center">
                        <a href="#" className="border border-gold/40 text-gold hover:bg-gold hover:text-accent-foreground px-6 py-2.5 text-[10px] font-body font-medium tracking-[0.15em] uppercase transition-all duration-300 inline-block">
                            Add Piece
                        </a>
                    </div>
                </div>
            </section>

            {/* Schedule Service Modal */}
            <AnimatePresence>
                {scheduleItem !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                        onClick={() => setScheduleItem(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border p-6 w-full max-w-sm"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-display text-lg text-foreground">Schedule Service</h3>
                                <button onClick={() => setScheduleItem(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-body block mb-1.5">Service Type</label>
                                    <select
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                        className="w-full bg-secondary border border-border text-foreground text-xs font-body px-3 py-2 focus:outline-none focus:border-gold/40"
                                    >
                                        {serviceTypes.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-body block mb-1.5">Preferred Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-secondary border border-border text-foreground text-xs font-body px-3 py-2 focus:outline-none focus:border-gold/40"
                                    />
                                </div>
                                <button
                                    onClick={handleSchedule}
                                    disabled={!selectedDate}
                                    className="w-full bg-gold hover:bg-gold-dark text-accent-foreground py-2.5 text-[10px] font-body font-medium tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-40"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

MyCollectionPage.layout = (page: React.ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);
