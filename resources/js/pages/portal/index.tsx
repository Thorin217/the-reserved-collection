import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Award,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    Flame,
    Gavel,
    Heart,
    LayoutDashboard,
    Package,
    RefreshCw,
    Shield,
    Truck,
} from 'lucide-react';
import { useRef, useState } from 'react';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { auctionHouse, catalog } from '@/routes/portal';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';

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
    featured: PortalProduct[];
    brands: Brand[];
    wishlistIds?: number[];
};

const trustItems = [
    {
        icon: Shield,
        title: 'Authenticity Guaranteed',
        desc: 'Every piece verified by certified experts',
    },
    {
        icon: Award,
        title: 'Certified Dealers',
        desc: '25,000+ trusted sellers worldwide',
    },
    {
        icon: Truck,
        title: 'Insured Shipping',
        desc: 'White-glove global delivery',
    },
    {
        icon: RefreshCw,
        title: 'Buyer Protection',
        desc: 'Full refund if not as described',
    },
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
    },
    {
        id: 5,
        name: 'Speedmaster Silver Snoopy',
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
    },
];

function formatBid(value: number): string {
    return formatCurrency(value);
}

function formatPrice(price: string | null): string {
    if (!price) {
        return 'Price on request';
    }

    return formatCurrency(price);
}

function ProductCard({
    product,
    inWishlist,
    onToggleWishlist,
}: {
    product: PortalProduct;
    inWishlist: boolean;
    onToggleWishlist: (id: number) => void;
}) {
    const discount =
        product.price &&
        product.compare_price &&
        Number(product.compare_price) > Number(product.price)
            ? Math.round(
                  (1 - Number(product.price) / Number(product.compare_price)) *
                      100,
              )
            : null;

    return (
        <Link
            href={`/products/${product.slug}`}
            className="group block w-45 shrink-0 cursor-pointer snap-start border border-border bg-card transition-all duration-300 hover:border-gold/25 sm:w-50"
        >
            <div className="relative aspect-square overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                        <Package
                            className="h-10 w-10 text-muted-foreground/15"
                            strokeWidth={1}
                        />
                    </div>
                )}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleWishlist(product.id);
                    }}
                    className={`absolute top-2 right-2 flex h-7 w-7 items-center justify-center backdrop-blur-sm transition-all ${inWishlist ? 'bg-gold/80 text-white opacity-100' : 'bg-background/60 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive'}`}
                    aria-label={
                        inWishlist ? 'Remove from wishlist' : 'Add to wishlist'
                    }
                >
                    <Heart
                        className="h-3 w-3"
                        strokeWidth={1.5}
                        fill={inWishlist ? 'currentColor' : 'none'}
                    />
                </button>
                {discount && (
                    <div className="absolute top-2 left-2">
                        <span className="bg-background/80 px-2 py-0.5 font-body text-[8px] font-medium tracking-wider text-gold uppercase backdrop-blur-sm">
                            -{discount}%
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3">
                {product.brand && (
                    <p className="mb-0.5 font-body text-[8px] tracking-[0.2em] text-muted-foreground uppercase">
                        {product.brand.name}
                    </p>
                )}
                <h3 className="mb-1.5 truncate font-display text-sm leading-tight text-foreground transition-colors group-hover:text-gold">
                    {product.name}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-semibold text-gold">
                        {formatPrice(product.price)}
                    </span>
                    {product.compare_price &&
                        Number(product.compare_price) >
                            Number(product.price) && (
                            <span className="font-body text-[10px] text-muted-foreground line-through">
                                {formatPrice(product.compare_price)}
                            </span>
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
        if (!scrollRef.current) {
            return;
        }
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }

    function scroll(dir: 'left' | 'right') {
        if (!scrollRef.current) {
            return;
        }
        const amount = scrollRef.current.clientWidth * 0.6;
        scrollRef.current.scrollBy({
            left: dir === 'left' ? -amount : amount,
            behavior: 'smooth',
        });
        setTimeout(checkScroll, 400);
    }

    return (
        <section className="bg-card py-14" id="auctions">
            <div className="container mx-auto px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="mb-1 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                            Auction House
                        </p>
                        <h2 className="font-display text-2xl font-light text-foreground md:text-3xl">
                            Live Auctions
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className="flex h-8 w-8 items-center justify-center border border-border text-foreground/60 transition-colors hover:border-gold hover:text-gold disabled:opacity-20"
                        >
                            <ChevronLeft
                                className="h-4 w-4"
                                strokeWidth={1.5}
                            />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className="flex h-8 w-8 items-center justify-center border border-border text-foreground/60 transition-colors hover:border-gold hover:text-gold disabled:opacity-20"
                        >
                            <ChevronRight
                                className="h-4 w-4"
                                strokeWidth={1.5}
                            />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="-mx-6 flex snap-x snap-proximity gap-3 overflow-x-auto px-6 pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {dummyAuctionItems.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.03, duration: 0.35 }}
                            className="w-[48vw] min-w-[170px] shrink-0 snap-start sm:w-[220px]"
                        >
                            <Link
                                href={auctionHouse()}
                                className="group block border border-border bg-secondary transition-all duration-300 hover:border-gold/25"
                            >
                                <div
                                    className={`relative aspect-[4/5] overflow-hidden bg-gradient-to-b ${item.gradient}`}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="p-4 text-center">
                                            <p className="mb-1 font-body text-[8px] tracking-[0.25em] text-gold/60 uppercase">
                                                {item.brand}
                                            </p>
                                            <p className="font-display text-xs leading-tight font-light text-white/80">
                                                {item.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                                    {item.hot && (
                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-destructive px-2 py-0.5 font-body text-[8px] font-medium tracking-wider text-destructive-foreground uppercase">
                                            <Flame className="h-2 w-2" /> Hot
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 px-2 py-0.5 font-body text-[8px] tracking-wider text-foreground backdrop-blur-sm">
                                        <Clock className="h-2 w-2 text-gold" />{' '}
                                        {item.endsIn}
                                    </div>
                                    <div className="absolute right-2 bottom-2 left-2 flex items-center justify-between">
                                        <span className="bg-background/80 px-2 py-0.5 font-body text-[7px] font-medium tracking-wider text-gold uppercase backdrop-blur-sm">
                                            {item.lotNumber}
                                        </span>
                                        <span className="flex items-center gap-0.5 bg-background/80 px-2 py-0.5 font-body text-[7px] text-foreground/70 backdrop-blur-sm">
                                            <Eye className="h-2 w-2" />{' '}
                                            {item.watchers}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="mb-0.5 font-body text-[8px] tracking-[0.2em] text-muted-foreground uppercase">
                                        {item.brand}
                                    </p>
                                    <h3 className="mb-2 truncate font-display text-sm leading-tight text-foreground">
                                        {item.name}
                                    </h3>
                                    <div className="mb-1 flex items-center justify-between">
                                        <div>
                                            <p className="mb-0.5 font-body text-[7px] tracking-wider text-muted-foreground uppercase">
                                                Current Bid
                                            </p>
                                            <span className="font-display text-sm font-semibold text-gold">
                                                {formatBid(item.currentBid)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="mb-0.5 font-body text-[7px] tracking-wider text-muted-foreground uppercase">
                                                Bids
                                            </p>
                                            <span className="flex items-center gap-0.5 font-body text-[11px] text-foreground">
                                                <Gavel className="h-2.5 w-2.5 text-gold" />{' '}
                                                {item.bids}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-1 font-body text-[8px] text-muted-foreground">
                                        Est. {formatBid(item.estimateLow)}–
                                        {formatBid(item.estimateHigh)}
                                    </div>
                                    <span className="mt-2 block w-full border border-gold/30 py-1.5 text-center font-body text-[9px] font-medium tracking-[0.12em] text-gold uppercase transition-all duration-300 hover:bg-gold hover:text-accent-foreground">
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

export default function PortalHome({
    featured,
    brands,
    wishlistIds = [],
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [localWishlist, setLocalWishlist] = useState<number[]>(wishlistIds);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    function checkScroll() {
        if (!scrollRef.current) {
            return;
        }
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }

    function scroll(dir: 'left' | 'right') {
        if (!scrollRef.current) {
            return;
        }
        const amount = scrollRef.current.clientWidth * 0.6;
        scrollRef.current.scrollBy({
            left: dir === 'left' ? -amount : amount,
            behavior: 'smooth',
        });
        setTimeout(checkScroll, 400);
    }

    function toggleWishlist(productId: number) {
        router.post(
            WishlistController.toggle.url({ product: productId }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLocalWishlist((prev) =>
                        prev.includes(productId)
                            ? prev.filter((id) => id !== productId)
                            : [...prev, productId],
                    );
                },
            },
        );
    }

    return (
        <>
            <Head title="The Reserved Collection" />

            {/* Hero Section */}
            <section className="relative flex h-[75vh] items-end overflow-hidden">
                <img
                    src="/images/hero-watches.jpg"
                    alt="Luxury timepiece"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="bg-hero-overlay absolute inset-0" />

                <div className="relative container mx-auto px-6 pb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.9,
                            ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className="max-w-lg"
                    >
                        <p className="mb-4 font-body text-[11px] font-light tracking-[0.4em] text-gold uppercase">
                            Est. 2024 — Curated Luxury
                        </p>
                        <p className="mb-8 max-w-md font-body text-sm leading-relaxed font-light text-foreground/60 md:text-base">
                            A private marketplace for authenticated luxury
                            watches, fine jewelry, and rare collectibles —
                            curated with discretion.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <Link
                                href={catalog()}
                                className="group inline-flex items-center gap-3 bg-gold px-7 py-3.5 font-body text-xs font-medium tracking-[0.15em] text-primary-foreground uppercase transition-all duration-300 hover:bg-gold-dark"
                            >
                                Explore Collection
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href={catalog()}
                                className="inline-flex items-center gap-3 border border-foreground/25 px-7 py-3.5 font-body text-xs font-medium tracking-[0.15em] text-foreground/80 uppercase transition-all duration-300 hover:border-gold hover:text-gold"
                            >
                                Browse All Brands
                            </Link>
                            {auth?.isAdmin && (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-2 border border-gold/40 px-7 py-3.5 font-body text-xs font-medium tracking-[0.15em] text-gold uppercase transition-all duration-300 hover:bg-gold/10"
                                >
                                    <LayoutDashboard
                                        className="h-3.5 w-3.5"
                                        strokeWidth={1.5}
                                    />
                                    Admin Panel
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>

                <div className="absolute right-0 bottom-0 left-0 h-24 bg-linear-to-t from-background to-transparent" />
            </section>

            {/* Featured Products — horizontal scroll */}
            <section className="bg-background py-14" id="watches">
                <div className="container mx-auto px-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="mb-1 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                                Curated Selection
                            </p>
                            <h2 className="font-display text-2xl font-light text-foreground md:text-3xl">
                                Featured Pieces
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                                className="flex h-8 w-8 items-center justify-center border border-border text-foreground/60 transition-colors hover:border-gold hover:text-gold disabled:opacity-20"
                            >
                                <ChevronLeft
                                    className="h-4 w-4"
                                    strokeWidth={1.5}
                                />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                                className="flex h-8 w-8 items-center justify-center border border-border text-foreground/60 transition-colors hover:border-gold hover:text-gold disabled:opacity-20"
                            >
                                <ChevronRight
                                    className="h-4 w-4"
                                    strokeWidth={1.5}
                                />
                            </button>
                        </div>
                    </div>

                    {featured.length === 0 ? (
                        <div className="py-16 text-center">
                            <Package
                                className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20"
                                strokeWidth={1}
                            />
                            <p className="font-body text-sm text-muted-foreground">
                                No pieces available yet.
                            </p>
                        </div>
                    ) : (
                        <div
                            ref={scrollRef}
                            onScroll={checkScroll}
                            className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                        >
                            {featured.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: i * 0.03,
                                        duration: 0.35,
                                    }}
                                >
                                    <ProductCard
                                        product={product}
                                        inWishlist={localWishlist.includes(
                                            product.id,
                                        )}
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
                <section className="bg-card py-16" id="brands">
                    <div className="container mx-auto px-6">
                        <div className="mb-10 text-center">
                            <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                                Our Partners
                            </p>
                            <h2 className="font-display text-2xl font-light text-foreground md:text-3xl">
                                Distinguished Maisons
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                            {brands.map((brand, i) => (
                                <motion.div
                                    key={brand.id}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Link
                                        href={catalog({
                                            query: {
                                                brand_id: String(brand.id),
                                            },
                                        })}
                                        className="block w-full border border-border bg-background px-5 py-4 text-center font-body text-xs font-light tracking-[0.12em] text-foreground uppercase transition-all hover:border-gold/30"
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
            <section className="bg-background py-16">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                        {trustItems.map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className="text-center"
                            >
                                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center border border-border">
                                    <item.icon
                                        className="h-4 w-4 text-gold"
                                        strokeWidth={1.5}
                                    />
                                </div>
                                <h3 className="mb-1 font-display text-sm text-foreground">
                                    {item.title}
                                </h3>
                                <p className="font-body text-[10px] font-light tracking-wide text-muted-foreground">
                                    {item.desc}
                                </p>
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
