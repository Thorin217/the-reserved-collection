import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Eye, Flame, Gavel, TrendingUp, Video, X } from 'lucide-react';
import { useState } from 'react';
import PortalLayout from '@/layouts/portal-layout';

type AuctionItem = {
    id: number;
    name: string;
    brand: string;
    currentBid: number;
    endsIn: string;
    bids: number;
    hot: boolean;
    lotNumber: string;
    watchers: number;
    estimateLow: number;
    estimateHigh: number;
    gradient: string;
    description: string;
};

const liveAuctions: AuctionItem[] = [
    { id: 1, name: 'Nautilus 5711/1A-010', brand: 'Patek Philippe', currentBid: 87500, endsIn: '2h 14m', bids: 23, hot: true, lotNumber: 'LOT-001', watchers: 156, estimateLow: 80000, estimateHigh: 95000, gradient: 'from-slate-800 to-slate-900', description: 'Stainless steel, blue dial, ref. 5711/1A-010. Full set with original papers dated 2019.' },
    { id: 2, name: 'Royal Oak Offshore 26470OR', brand: 'Audemars Piguet', currentBid: 34200, endsIn: '4h 32m', bids: 15, hot: false, lotNumber: 'LOT-002', watchers: 89, estimateLow: 30000, estimateHigh: 38000, gradient: 'from-amber-900 to-stone-900', description: '18k rose gold case, brown dial, brown alligator strap. Box and papers 2021.' },
    { id: 3, name: 'Panthère de Cartier Ring', brand: 'Cartier', currentBid: 18900, endsIn: '1h 08m', bids: 31, hot: true, lotNumber: 'LOT-003', watchers: 203, estimateLow: 16000, estimateHigh: 22000, gradient: 'from-zinc-800 to-neutral-900', description: '18k white gold, set with diamonds and onyx. Circa 1990, excellent condition.' },
    { id: 4, name: 'Daytona Rainbow 116595RBOW', brand: 'Rolex', currentBid: 245000, endsIn: '6h 55m', bids: 8, hot: false, lotNumber: 'LOT-004', watchers: 312, estimateLow: 220000, estimateHigh: 260000, gradient: 'from-green-900 to-emerald-950', description: '18k Everose gold, multicolor sapphire bezel, black dial with gem-set hour markers.' },
    { id: 5, name: 'Speedmaster Silver Snoopy Award', brand: 'Omega', currentBid: 52000, endsIn: '3h 41m', bids: 19, hot: false, lotNumber: 'LOT-005', watchers: 127, estimateLow: 45000, estimateHigh: 55000, gradient: 'from-gray-800 to-slate-900', description: 'Limited edition 50th anniversary of Silver Snoopy Award. Full set, unworn.' },
    { id: 6, name: 'Birkin 25 Himalaya Niloticus', brand: 'Hermès', currentBid: 185000, endsIn: '8h 20m', bids: 12, hot: true, lotNumber: 'LOT-006', watchers: 445, estimateLow: 170000, estimateHigh: 200000, gradient: 'from-stone-800 to-stone-950', description: 'Niloticus crocodile leather, palladium hardware. One of the most sought-after Birkins in existence.' },
];

const negotiationItems = [
    { id: 101, name: 'Patek Philippe Calatrava 5196P', brand: 'Patek Philippe', askingPrice: 62000, gradient: 'from-indigo-900 to-slate-900', seller: 'Geneva Estate', available: true },
    { id: 102, name: 'Vacheron Constantin Historiques', brand: 'Vacheron Constantin', askingPrice: 28500, gradient: 'from-rose-900 to-stone-900', seller: 'Zurich Collection', available: true },
    { id: 103, name: 'A. Lange & Söhne Datograph', brand: 'A. Lange & Söhne', askingPrice: 95000, gradient: 'from-cyan-900 to-slate-900', seller: 'Berlin Atelier', available: false },
];

function formatBid(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function AuctionCard({ item }: { item: AuctionItem }) {
    const [showDetail, setShowDetail] = useState(false);
    const [bid, setBid] = useState('');

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group bg-secondary border border-border hover:border-gold/25 transition-all duration-300"
            >
                <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-b ${item.gradient}`}>
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="text-center">
                            <p className="text-[8px] text-gold/70 uppercase tracking-[0.3em] font-body mb-2">{item.brand}</p>
                            <p className="text-white/85 text-sm font-display font-light leading-tight">{item.name}</p>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                    {item.hot && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-destructive text-destructive-foreground px-2 py-0.5 text-[8px] font-body font-medium tracking-wider uppercase">
                            <Flame className="w-2 h-2" /> Hot
                        </div>
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-[8px] font-body tracking-wider text-foreground px-2 py-0.5">
                        <Clock className="w-2 h-2 text-gold" /> {item.endsIn}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="bg-background/80 backdrop-blur-sm text-[7px] font-body font-medium text-gold px-2 py-0.5 tracking-wider uppercase">
                            {item.lotNumber}
                        </span>
                        <span className="bg-background/80 backdrop-blur-sm text-[7px] font-body text-foreground/70 px-2 py-0.5 flex items-center gap-1">
                            <Eye className="w-2 h-2" /> {item.watchers}
                        </span>
                    </div>
                </div>
                <div className="p-4">
                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-0.5">{item.brand}</p>
                    <h3 className="font-display text-sm text-foreground leading-tight mb-1">{item.name}</h3>
                    <p className="text-[9px] text-muted-foreground font-body mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <p className="text-[7px] text-muted-foreground uppercase tracking-wider font-body mb-0.5">Current Bid</p>
                            <span className="text-base font-display font-semibold text-gold">{formatBid(item.currentBid)}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[7px] text-muted-foreground uppercase tracking-wider font-body mb-0.5">Bids</p>
                            <span className="flex items-center gap-0.5 text-sm font-body text-foreground">
                                <Gavel className="w-3 h-3 text-gold" strokeWidth={1.5} /> {item.bids}
                            </span>
                        </div>
                    </div>
                    <p className="text-[8px] text-muted-foreground font-body mb-3">
                        Est. {formatBid(item.estimateLow)}–{formatBid(item.estimateHigh)}
                    </p>
                    <button
                        onClick={() => setShowDetail(true)}
                        className="w-full border border-gold/30 text-gold hover:bg-gold hover:text-accent-foreground py-2 text-[9px] font-body font-medium tracking-[0.12em] uppercase transition-all duration-300"
                    >
                        Place Bid
                    </button>
                </div>
            </motion.div>

            {/* Bid modal */}
            <AnimatePresence>
                {showDetail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                        onClick={() => setShowDetail(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border p-6 w-full max-w-sm"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-[8px] text-gold uppercase tracking-[0.2em] font-body">{item.brand}</p>
                                    <h3 className="font-display text-lg text-foreground">{item.name}</h3>
                                </div>
                                <button onClick={() => setShowDetail(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </div>
                            <div className="bg-secondary/50 border border-border p-3 mb-4">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[9px] text-muted-foreground font-body">Current Bid</span>
                                    <span className="text-[9px] text-gold font-body font-medium">{formatBid(item.currentBid)}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-[9px] text-muted-foreground font-body">Ends In</span>
                                    <span className="text-[9px] text-foreground font-body">{item.endsIn}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[9px] text-muted-foreground font-body">Lot</span>
                                    <span className="text-[9px] text-foreground font-body">{item.lotNumber}</span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-body block mb-1.5">Your Bid (USD)</label>
                                <input
                                    type="number"
                                    value={bid}
                                    onChange={(e) => setBid(e.target.value)}
                                    placeholder={String(item.currentBid + 500)}
                                    className="w-full bg-secondary border border-border text-foreground text-sm font-body px-3 py-2 focus:outline-none focus:border-gold/40"
                                />
                                <p className="text-[8px] text-muted-foreground font-body mt-1">Minimum bid: {formatBid(item.currentBid + 500)}</p>
                            </div>
                            <button
                                disabled={!bid || Number(bid) <= item.currentBid}
                                className="w-full bg-gold hover:bg-gold-dark text-accent-foreground py-2.5 text-[10px] font-body font-medium tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-40"
                                onClick={() => { setShowDetail(false); setBid(''); }}
                            >
                                Confirm Bid
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default function AuctionHousePage() {
    const [activeTab, setActiveTab] = useState<'auction' | 'negotiation'>('auction');

    return (
        <>
            <Head title="Auction House — The Reserved Collection" />

            <div className="pt-0">
                {/* Header */}
                <div className="border-b border-border">
                    <div className="container mx-auto px-4 sm:px-6 py-6">
                        <p className="text-gold font-body font-light tracking-[0.25em] uppercase text-[10px] mb-1">Auction House</p>
                        <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-6">Live Events</h1>

                        {/* Tab Switcher */}
                        <div className="flex gap-1 bg-secondary/50 p-1 w-fit">
                            <button
                                onClick={() => setActiveTab('auction')}
                                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-body font-medium tracking-[0.15em] uppercase transition-all duration-300 ${
                                    activeTab === 'auction' ? 'bg-gold text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Gavel className="w-3.5 h-3.5" />
                                Live Auction
                            </button>
                            <button
                                onClick={() => setActiveTab('negotiation')}
                                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-body font-medium tracking-[0.15em] uppercase transition-all duration-300 ${
                                    activeTab === 'negotiation' ? 'bg-gold text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Video className="w-3.5 h-3.5" />
                                Live Negotiation
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'auction' ? (
                        <motion.div
                            key="auction"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-8"
                        >
                            <div className="container mx-auto px-4 sm:px-6">
                                {/* Live indicator */}
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                                    </span>
                                    <span className="text-[10px] text-foreground/60 font-body tracking-[0.2em] uppercase">6 Active Auctions · Updates live</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {liveAuctions.map((item) => (
                                        <AuctionCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="negotiation"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-8"
                        >
                            <div className="container mx-auto px-4 sm:px-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                                    </span>
                                    <span className="text-[10px] text-foreground/60 font-body tracking-[0.2em] uppercase">3 Sessions Available</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {negotiationItems.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.06 }}
                                            className="bg-secondary border border-border hover:border-gold/25 transition-all duration-300"
                                        >
                                            <div className={`aspect-[4/3] bg-gradient-to-b ${item.gradient} flex items-center justify-center p-6`}>
                                                <div className="text-center">
                                                    <p className="text-[8px] text-gold/70 uppercase tracking-[0.3em] font-body mb-2">{item.brand}</p>
                                                    <p className="text-white/85 text-sm font-display font-light">{item.name}</p>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-0.5">{item.seller}</p>
                                                <h3 className="font-display text-sm text-foreground mb-2">{item.name}</h3>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <p className="text-[7px] text-muted-foreground uppercase tracking-wider font-body mb-0.5">Asking Price</p>
                                                        <span className="text-base font-display font-semibold text-gold">{formatBid(item.askingPrice)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {item.available ? (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                <span className="text-[9px] text-green-500 font-body">Available</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                                                <span className="text-[9px] text-muted-foreground font-body">In Session</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={!item.available}
                                                    className="w-full border border-gold/30 text-gold hover:bg-gold hover:text-accent-foreground py-2 text-[9px] font-body font-medium tracking-[0.12em] uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <TrendingUp className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                                                    Start Negotiation
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

AuctionHousePage.layout = (page: React.ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);
