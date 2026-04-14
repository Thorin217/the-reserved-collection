import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Eye, Flame, Gavel, TrendingUp, Video, X } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
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
    {
        id: 1,
        name: 'Nautilus 5711/1A-010',
        brand: 'Patek Philippe',
        currentBid: 87500,
        endsIn: '2h 14m',
        bids: 23,
        hot: true,
        lotNumber: 'LOT-001',
        watchers: 156,
        estimateLow: 80000,
        estimateHigh: 95000,
        gradient: 'from-slate-800 to-slate-900',
        description:
            'Stainless steel, blue dial, ref. 5711/1A-010. Full set with original papers dated 2019.',
    },
    {
        id: 2,
        name: 'Royal Oak Offshore 26470OR',
        brand: 'Audemars Piguet',
        currentBid: 34200,
        endsIn: '4h 32m',
        bids: 15,
        hot: false,
        lotNumber: 'LOT-002',
        watchers: 89,
        estimateLow: 30000,
        estimateHigh: 38000,
        gradient: 'from-amber-900 to-stone-900',
        description:
            '18k rose gold case, brown dial, brown alligator strap. Box and papers 2021.',
    },
    {
        id: 3,
        name: 'Panthère de Cartier Ring',
        brand: 'Cartier',
        currentBid: 18900,
        endsIn: '1h 08m',
        bids: 31,
        hot: true,
        lotNumber: 'LOT-003',
        watchers: 203,
        estimateLow: 16000,
        estimateHigh: 22000,
        gradient: 'from-zinc-800 to-neutral-900',
        description:
            '18k white gold, set with diamonds and onyx. Circa 1990, excellent condition.',
    },
    {
        id: 4,
        name: 'Daytona Rainbow 116595RBOW',
        brand: 'Rolex',
        currentBid: 245000,
        endsIn: '6h 55m',
        bids: 8,
        hot: false,
        lotNumber: 'LOT-004',
        watchers: 312,
        estimateLow: 220000,
        estimateHigh: 260000,
        gradient: 'from-green-900 to-emerald-950',
        description:
            '18k Everose gold, multicolor sapphire bezel, black dial with gem-set hour markers.',
    },
    {
        id: 5,
        name: 'Speedmaster Silver Snoopy Award',
        brand: 'Omega',
        currentBid: 52000,
        endsIn: '3h 41m',
        bids: 19,
        hot: false,
        lotNumber: 'LOT-005',
        watchers: 127,
        estimateLow: 45000,
        estimateHigh: 55000,
        gradient: 'from-gray-800 to-slate-900',
        description:
            'Limited edition 50th anniversary of Silver Snoopy Award. Full set, unworn.',
    },
    {
        id: 6,
        name: 'Birkin 25 Himalaya Niloticus',
        brand: 'Hermès',
        currentBid: 185000,
        endsIn: '8h 20m',
        bids: 12,
        hot: true,
        lotNumber: 'LOT-006',
        watchers: 445,
        estimateLow: 170000,
        estimateHigh: 200000,
        gradient: 'from-stone-800 to-stone-950',
        description:
            'Niloticus crocodile leather, palladium hardware. One of the most sought-after Birkins in existence.',
    },
];

const negotiationItems = [
    {
        id: 101,
        name: 'Patek Philippe Calatrava 5196P',
        brand: 'Patek Philippe',
        askingPrice: 62000,
        gradient: 'from-indigo-900 to-slate-900',
        seller: 'Geneva Estate',
        available: true,
    },
    {
        id: 102,
        name: 'Vacheron Constantin Historiques',
        brand: 'Vacheron Constantin',
        askingPrice: 28500,
        gradient: 'from-rose-900 to-stone-900',
        seller: 'Zurich Collection',
        available: true,
    },
    {
        id: 103,
        name: 'A. Lange & Söhne Datograph',
        brand: 'A. Lange & Söhne',
        askingPrice: 95000,
        gradient: 'from-cyan-900 to-slate-900',
        seller: 'Berlin Atelier',
        available: false,
    },
];

function formatBid(value: number): string {
    return formatCurrency(value);
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
                className="group border border-border bg-secondary transition-all duration-300 hover:border-gold/25"
            >
                <div
                    className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-b ${item.gradient}`}
                >
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="text-center">
                            <p className="mb-2 font-body text-[8px] tracking-[0.3em] text-gold/70 uppercase">
                                {item.brand}
                            </p>
                            <p className="font-display text-sm leading-tight font-light text-white/85">
                                {item.name}
                            </p>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                    {item.hot && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-destructive px-2 py-0.5 font-body text-[8px] font-medium tracking-wider text-destructive-foreground uppercase">
                            <Flame className="h-2 w-2" /> Hot
                        </div>
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 px-2 py-0.5 font-body text-[8px] tracking-wider text-foreground backdrop-blur-sm">
                        <Clock className="h-2 w-2 text-gold" /> {item.endsIn}
                    </div>
                    <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
                        <span className="bg-background/80 px-2 py-0.5 font-body text-[7px] font-medium tracking-wider text-gold uppercase backdrop-blur-sm">
                            {item.lotNumber}
                        </span>
                        <span className="flex items-center gap-1 bg-background/80 px-2 py-0.5 font-body text-[7px] text-foreground/70 backdrop-blur-sm">
                            <Eye className="h-2 w-2" /> {item.watchers}
                        </span>
                    </div>
                </div>
                <div className="p-4">
                    <p className="mb-0.5 font-body text-[8px] tracking-[0.2em] text-muted-foreground uppercase">
                        {item.brand}
                    </p>
                    <h3 className="mb-1 font-display text-sm leading-tight text-foreground">
                        {item.name}
                    </h3>
                    <p className="mb-3 line-clamp-2 font-body text-[9px] text-muted-foreground">
                        {item.description}
                    </p>
                    <div className="mb-2 flex items-end justify-between">
                        <div>
                            <p className="mb-0.5 font-body text-[7px] tracking-wider text-muted-foreground uppercase">
                                Current Bid
                            </p>
                            <span className="font-display text-base font-semibold text-gold">
                                {formatBid(item.currentBid)}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="mb-0.5 font-body text-[7px] tracking-wider text-muted-foreground uppercase">
                                Bids
                            </p>
                            <span className="flex items-center gap-0.5 font-body text-sm text-foreground">
                                <Gavel
                                    className="h-3 w-3 text-gold"
                                    strokeWidth={1.5}
                                />{' '}
                                {item.bids}
                            </span>
                        </div>
                    </div>
                    <p className="mb-3 font-body text-[8px] text-muted-foreground">
                        Est. {formatBid(item.estimateLow)}–
                        {formatBid(item.estimateHigh)}
                    </p>
                    <button
                        onClick={() => setShowDetail(true)}
                        className="w-full border border-gold/30 py-2 font-body text-[9px] font-medium tracking-[0.12em] text-gold uppercase transition-all duration-300 hover:bg-gold hover:text-accent-foreground"
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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
                        onClick={() => setShowDetail(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm border border-border bg-card p-6"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <p className="font-body text-[8px] tracking-[0.2em] text-gold uppercase">
                                        {item.brand}
                                    </p>
                                    <h3 className="font-display text-lg text-foreground">
                                        {item.name}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowDetail(false)}
                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <X className="h-4 w-4" strokeWidth={1.5} />
                                </button>
                            </div>
                            <div className="mb-4 border border-border bg-secondary/50 p-3">
                                <div className="mb-1 flex justify-between">
                                    <span className="font-body text-[9px] text-muted-foreground">
                                        Current Bid
                                    </span>
                                    <span className="font-body text-[9px] font-medium text-gold">
                                        {formatBid(item.currentBid)}
                                    </span>
                                </div>
                                <div className="mb-1 flex justify-between">
                                    <span className="font-body text-[9px] text-muted-foreground">
                                        Ends In
                                    </span>
                                    <span className="font-body text-[9px] text-foreground">
                                        {item.endsIn}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-body text-[9px] text-muted-foreground">
                                        Lot
                                    </span>
                                    <span className="font-body text-[9px] text-foreground">
                                        {item.lotNumber}
                                    </span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="mb-1.5 block font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                    Your Bid (USD)
                                </label>
                                <input
                                    type="number"
                                    value={bid}
                                    onChange={(e) => setBid(e.target.value)}
                                    placeholder={String(item.currentBid + 500)}
                                    className="w-full border border-border bg-secondary px-3 py-2 font-body text-sm text-foreground focus:border-gold/40 focus:outline-none"
                                />
                                <p className="mt-1 font-body text-[8px] text-muted-foreground">
                                    Minimum bid:{' '}
                                    {formatBid(item.currentBid + 500)}
                                </p>
                            </div>
                            <button
                                disabled={
                                    !bid || Number(bid) <= item.currentBid
                                }
                                className="w-full bg-gold py-2.5 font-body text-[10px] font-medium tracking-[0.15em] text-accent-foreground uppercase transition-all duration-300 hover:bg-gold-dark disabled:opacity-40"
                                onClick={() => {
                                    setShowDetail(false);
                                    setBid('');
                                }}
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
    const [activeTab, setActiveTab] = useState<'auction' | 'negotiation'>(
        'auction',
    );

    return (
        <>
            <Head title="Auction House — The Reserved Collection" />

            <div className="pt-0">
                {/* Header */}
                <div className="border-b border-border">
                    <div className="container mx-auto px-4 py-6 sm:px-6">
                        <p className="mb-1 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                            Auction House
                        </p>
                        <h1 className="mb-6 font-display text-3xl font-light text-foreground md:text-4xl">
                            Live Events
                        </h1>

                        {/* Tab Switcher */}
                        <div className="flex w-fit gap-1 bg-secondary/50 p-1">
                            <button
                                onClick={() => setActiveTab('auction')}
                                className={`flex items-center gap-2 px-5 py-2.5 font-body text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 ${
                                    activeTab === 'auction'
                                        ? 'bg-gold text-accent-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Gavel className="h-3.5 w-3.5" />
                                Live Auction
                            </button>
                            <button
                                onClick={() => setActiveTab('negotiation')}
                                className={`flex items-center gap-2 px-5 py-2.5 font-body text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 ${
                                    activeTab === 'negotiation'
                                        ? 'bg-gold text-accent-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Video className="h-3.5 w-3.5" />
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
                                <div className="mb-6 flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                                    </span>
                                    <span className="font-body text-[10px] tracking-[0.2em] text-foreground/60 uppercase">
                                        6 Active Auctions · Updates live
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {liveAuctions.map((item) => (
                                        <AuctionCard
                                            key={item.id}
                                            item={item}
                                        />
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
                                <div className="mb-6 flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                                    </span>
                                    <span className="font-body text-[10px] tracking-[0.2em] text-foreground/60 uppercase">
                                        3 Sessions Available
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {negotiationItems.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.06 }}
                                            className="border border-border bg-secondary transition-all duration-300 hover:border-gold/25"
                                        >
                                            <div
                                                className={`aspect-[4/3] bg-gradient-to-b ${item.gradient} flex items-center justify-center p-6`}
                                            >
                                                <div className="text-center">
                                                    <p className="mb-2 font-body text-[8px] tracking-[0.3em] text-gold/70 uppercase">
                                                        {item.brand}
                                                    </p>
                                                    <p className="font-display text-sm font-light text-white/85">
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <p className="mb-0.5 font-body text-[8px] tracking-[0.2em] text-muted-foreground uppercase">
                                                    {item.seller}
                                                </p>
                                                <h3 className="mb-2 font-display text-sm text-foreground">
                                                    {item.name}
                                                </h3>
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="mb-0.5 font-body text-[7px] tracking-wider text-muted-foreground uppercase">
                                                            Asking Price
                                                        </p>
                                                        <span className="font-display text-base font-semibold text-gold">
                                                            {formatBid(
                                                                item.askingPrice,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {item.available ? (
                                                            <>
                                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                                <span className="font-body text-[9px] text-green-500">
                                                                    Available
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                                <span className="font-body text-[9px] text-muted-foreground">
                                                                    In Session
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={!item.available}
                                                    className="w-full border border-gold/30 py-2 font-body text-[9px] font-medium tracking-[0.12em] text-gold uppercase transition-all duration-300 hover:bg-gold hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <TrendingUp
                                                        className="mr-1 inline h-3 w-3"
                                                        strokeWidth={1.5}
                                                    />
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
