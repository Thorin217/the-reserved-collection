import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Award, ChevronLeft, ChevronRight, Clock, Eye, Flame, Gavel, Heart, Package, RefreshCw, Shield, Truck } from 'lucide-react';
import { useRef, useState } from 'react';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import PortalLayout from '@/layouts/portal-layout';
import { auctionHouse, catalog } from '@/routes/portal';

type PortalProduct = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    brand?: { id: number; name: string; slug: string };
    category?: { id: number; name: string; slug: string };
    price: string | null;
    compare_price: string | null;
    image_url: string;
};

type Brand = {
    id: number;
    name: string;
    slug: string;
    products_count: number;
};

type Props = {
    featured: { data: PortalProduct[] };
    brands: Brand[];
    wishlistIds?: number[];
};

const trustItems = [
    { icon: Shield, title: 'Authenticity Guaranteed', desc: 'Every piece verified by certified experts' },
    { icon: Award, title: 'Certified Dealers', desc: '25,000+ trusted sellers worldwide' },
    { icon: Truck, title: 'Insured Shipping', desc: 'White-glove global delivery' },
    { icon: RefreshCw, title: 'Buyer Protection', desc: 'Full refund if not as described' },
];

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
};

const dummyAuctionItems: AuctionItem[] = [
    { id: 1, name: 'Nautilus 5711/1A-010', brand: 'Patek Philippe', currentBid: 87500, endsIn: '2h 14m', bids: 23, hot: true, lotNumber: 'LOT-001', watchers: 156, estimateLow: 80000, estimateHigh: 95000, gradient: 'from-slate-800 to-slate-900' },
    { id: 2, name: 'Royal Oak Offshore 26470OR', brand: 'Audemars Piguet', currentBid: 34200, endsIn: '4h 32m', bids: 15, hot: false, lotNumber: 'LOT-002', watchers: 89, estimateLow: 30000, estimateHigh: 38000, gradient: 'from-amber-900 to-stone-900' },
    { id: 3, name: 'Panthère de Cartier Ring', brand: 'Cartier', currentBid: 18900, endsIn: '1h 08m', bids: 31, hot: true, lotNumber: 'LOT-003', watchers: 203, estimateLow: 16000, estimateHigh: 22000, gradient: 'from-zinc-800 to-neutral-900' },
    { id: 4, name: 'Daytona Rainbow 116595RBOW', brand: 'Rolex', currentBid: 245000, endsIn: '6h 55m', bids: 8, hot: false, lotNumber: 'LOT-004', watchers: 312, estimateLow: 220000, estimateHigh: 260000, gradient: 'from-green-900 to-emerald-950' },
    { id: 5, name: 'Speedmaster Silver Snoopy', brand: 'Omega', currentBid: 52000, endsIn: '3h 41m', bids: 19, hot: false, lotNumber: 'LOT-005', watchers: 127, estimateLow: 45000, estimateHigh: 55000, gradient: 'from-gray-800 to-slate-900' },
    { id: 6, name: 'Birkin 25 Himalaya Niloticus', brand: 'Hermès', currentBid: 185000, endsIn: '8h 20m', bids: 12, hot: true, lotNumber: 'LOT-006', watchers: 445, estimateLow: 170000, estimateHigh: 200000, gradient: 'from-stone-800 to-stone-950' },
];

function formatBid(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatPrice(price: string | null): string {
    if (!price) { return 'Price on request'; }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(price));
}

function ProductCard({ product, inWishlist, onToggleWishlist }: { product: PortalProduct; inWishlist: boolean; onToggleWishlist: (id: number) => void }) {
    const discount = product.price && product.compare_price && Number(product.compare_price) > Number(product.price)
        ? Math.round((1 - Number(product.price) / Number(product.compare_price)) * 100)
        : null;

    return (
        <Link href={`/products/${product.slug}`} className="group block bg-card border border-border hover:border-gold/25 transition-all duration-300 cursor-pointer shrink-0 w-45 sm:w-50 snap-start">
            <div className="relative aspect-square overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Package className="w-10 h-10 text-muted-foreground/15" strokeWidth={1} />
                    </div>
                )}
                <button
                    onClick={(e) => { e.preventDefault(); onToggleWishlist(product.id); }}
                    className={`absolute top-2 right-2 w-7 h-7 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${inWishlist ? 'bg-gold/80 text-white' : 'bg-background/60 text-muted-foreground hover:text-destructive'}`}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <Heart className="w-3 h-3" strokeWidth={1.5} fill={inWishlist ? 'currentColor' : 'none'} />
                </button>
                {discount && (
                    <div className="absolute top-2 left-2">
                        <span className="bg-background/80 backdrop-blur-sm text-[8px] font-body font-medium text-gold px-2 py-0.5 uppercase tracking-wider">
                            -{discount}%
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3">
                {product.brand && (
                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-0.5">{product.brand.name}</p>
                )}
                <h3 className="font-display text-sm text-foreground leading-tight mb-1.5 truncate group-hover:text-gold transition-colors">{product.name}</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-body font-semibold text-gold">{formatPrice(product.price)}</span>
                    {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                        <span className="text-[10px] font-body text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

function AuctionSection() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    function checkScroll() {
        if (!scrollRef.current) { return; }
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }

    function scroll(dir: 'left' | 'right') {
        if (!scrollRef.current) { return; }
        const amount = scrollRef.current.clientWidth * 0.6;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
        setTimeout(checkScroll, 400);
    }

    return (
        <section className="py-14 bg-card" id="auctions">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-gold font-body font-light tracking-[0.25em] uppercase text-[10px] mb-1">Auction House</p>
                        <h2 className="font-display text-2xl md:text-3xl font-light text-foreground">Live Auctions</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => scroll('left')} disabled={!canScrollLeft} className="w-8 h-8 border border-border flex items-center justify-center text-foreground/60 hover:border-gold hover:text-gold transition-colors disabled:opacity-20">
                            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => scroll('right')} disabled={!canScrollRight} className="w-8 h-8 border border-border flex items-center justify-center text-foreground/60 hover:border-gold hover:text-gold transition-colors disabled:opacity-20">
                            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-proximity"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {dummyAuctionItems.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.03, duration: 0.35 }}
                            className="shrink-0 w-[48vw] min-w-[170px] sm:w-[220px] snap-start"
                        >
                            <Link href={auctionHouse()} className="group block bg-secondary border border-border hover:border-gold/25 transition-all duration-300">
                                <div className={`relative aspect-[4/5] overflow-hidden bg-gradient-to-b ${item.gradient}`}>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center p-4">
                                            <p className="text-[8px] text-gold/60 uppercase tracking-[0.25em] font-body mb-1">{item.brand}</p>
                                            <p className="text-white/80 text-xs font-display font-light leading-tight">{item.name}</p>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                                    {item.hot && (
                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-destructive text-destructive-foreground px-2 py-0.5 text-[8px] font-body font-medium tracking-wider uppercase">
                                            <Flame className="w-2 h-2" /> Hot
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-[8px] font-body tracking-wider text-foreground px-2 py-0.5">
                                        <Clock className="w-2 h-2 text-gold" /> {item.endsIn}
                                    </div>
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                        <span className="bg-background/80 backdrop-blur-sm text-[7px] font-body font-medium text-gold px-2 py-0.5 tracking-wider uppercase">
                                            {item.lotNumber}
                                        </span>
                                        <span className="bg-background/80 backdrop-blur-sm text-[7px] font-body text-foreground/70 px-2 py-0.5 flex items-center gap-0.5">
                                            <Eye className="w-2 h-2" /> {item.watchers}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-0.5">{item.brand}</p>
                                    <h3 className="font-display text-sm text-foreground leading-tight mb-2 truncate">{item.name}</h3>
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <p className="text-[7px] text-muted-foreground uppercase tracking-wider font-body mb-0.5">Current Bid</p>
                                            <span className="text-sm font-display font-semibold text-gold">{formatBid(item.currentBid)}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[7px] text-muted-foreground uppercase tracking-wider font-body mb-0.5">Bids</p>
                                            <span className="flex items-center gap-0.5 text-[11px] font-body text-foreground">
                                                <Gavel className="w-2.5 h-2.5 text-gold" /> {item.bids}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[8px] text-muted-foreground font-body mt-1">
                                        Est. {formatBid(item.estimateLow)}–{formatBid(item.estimateHigh)}
                                    </div>
                                    <span className="mt-2 w-full border border-gold/30 text-gold hover:bg-gold hover:text-accent-foreground py-1.5 text-[9px] font-body font-medium tracking-[0.12em] uppercase transition-all duration-300 block text-center">
                                        Place Bid
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function PortalHome({ featured, brands, wishlistIds = [] }: Props) {
    const [localWishlist, setLocalWishlist] = useState<number[]>(wishlistIds);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    function checkScroll() {
        if (!scrollRef.current) { return; }
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }

    function scroll(dir: 'left' | 'right') {
        if (!scrollRef.current) { return; }
        const amount = scrollRef.current.clientWidth * 0.6;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
        setTimeout(checkScroll, 400);
    }

    function toggleWishlist(productId: number) {
        router.post(WishlistController.toggle.url({ product: productId }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setLocalWishlist((prev) =>
                    prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
                );
            },
        });
    }

    return (
        <>
            <Head title="The Reserved Collection" />

            {/* Hero Section */}
            <section className="relative h-[75vh] flex items-end overflow-hidden">
                <img
                    src="/images/hero-watches.jpg"
                    alt="Luxury timepiece"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-hero-overlay" />

                <div className="relative container mx-auto px-6 pb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                        className="max-w-lg"
                    >
                        <p className="text-gold font-body font-light tracking-[0.4em] uppercase text-[11px] mb-4">
                            Est. 2024 — Curated Luxury
                        </p>
                        <p className="text-foreground/60 text-sm md:text-base mb-8 max-w-md font-body font-light leading-relaxed">
                            A private marketplace for authenticated luxury watches, fine jewelry, and rare collectibles — curated with discretion.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <Link
                                href={catalog()}
                                className="group inline-flex items-center gap-3 bg-gold hover:bg-gold-dark text-primary-foreground px-7 py-3.5 font-body text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300"
                            >
                                Explore Collection
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href={catalog()}
                                className="inline-flex items-center gap-3 border border-foreground/25 text-foreground/80 hover:border-gold hover:text-gold px-7 py-3.5 font-body text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300"
                            >
                                Browse All Brands
                            </Link>
                        </div>
                    </motion.div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent" />
            </section>

            {/* Featured Products — horizontal scroll */}
            <section className="py-14 bg-background" id="watches">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-gold font-body font-light tracking-[0.25em] uppercase text-[10px] mb-1">
                                Curated Selection
                            </p>
                            <h2 className="font-display text-2xl md:text-3xl font-light text-foreground">
                                Featured Pieces
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                                className="w-8 h-8 border border-border flex items-center justify-center text-foreground/60 hover:border-gold hover:text-gold transition-colors disabled:opacity-20"
                            >
                                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                                className="w-8 h-8 border border-border flex items-center justify-center text-foreground/60 hover:border-gold hover:text-gold transition-colors disabled:opacity-20"
                            >
                                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>

                    {featured.data.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" strokeWidth={1} />
                            <p className="text-sm text-muted-foreground font-body">No pieces available yet.</p>
                        </div>
                    ) : (
                        <div
                            ref={scrollRef}
                            onScroll={checkScroll}
                            className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {featured.data.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.03, duration: 0.35 }}
                                >
                                    <ProductCard
                                        product={product}
                                        inWishlist={localWishlist.includes(product.id)}
                                        onToggleWishlist={toggleWishlist}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Auction Section */}
            <AuctionSection />

            {/* Brands Section */}
            {brands.length > 0 && (
                <section className="py-16 bg-card" id="brands">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-10">
                            <p className="text-gold font-body font-light tracking-[0.25em] uppercase text-[10px] mb-2">
                                Our Partners
                            </p>
                            <h2 className="font-display text-2xl md:text-3xl font-light text-foreground">
                                Distinguished Maisons
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {brands.map((brand, i) => (
                                <motion.div
                                    key={brand.id}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Link
                                        href={catalog({ query: { brand_id: String(brand.id) } })}
                                        className="block w-full px-5 py-4 border border-border bg-background hover:border-gold/30 transition-all text-xs font-body font-light text-foreground tracking-[0.12em] uppercase text-center"
                                    >
                                        {brand.name}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Trust Section */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {trustItems.map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className="text-center"
                            >
                                <div className="w-10 h-10 border border-border flex items-center justify-center mx-auto mb-4">
                                    <item.icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-display text-sm text-foreground mb-1">{item.title}</h3>
                                <p className="text-muted-foreground font-body font-light text-[10px] tracking-wide">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

PortalHome.layout = (page: React.ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);
