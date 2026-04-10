import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Heart, Package, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import PortalLayout from '@/layouts/portal-layout';
import { catalog } from '@/routes/portal';
import type { PaginatedData } from '@/types';

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

type SimpleModel = { id: number; name: string; slug: string };

type Props = {
    products: PaginatedData<PortalProduct>;
    brands: SimpleModel[];
    categories: SimpleModel[];
    wishlistIds: number[];
    filters: { search?: string; brand_id?: string; category_slug?: string };
};

function formatPrice(price: string | null): string {
    if (!price) { return 'Price on request'; }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(price));
}

function ProductCard({ product, inWishlist, onToggle }: { product: PortalProduct; inWishlist: boolean; onToggle: (id: number) => void }) {
    return (
        <Link href={`/products/${product.slug}`} className="group block bg-card border border-border hover:border-gold/25 transition-all duration-300">
            <div className="relative aspect-square overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Package className="w-10 h-10 text-muted-foreground/20" strokeWidth={1} />
                    </div>
                )}
                {product.category && (
                    <div className="absolute top-2 left-2">
                        <span className="bg-background/80 backdrop-blur-sm text-[8px] font-body font-medium text-gold px-2 py-0.5 uppercase tracking-wider">
                            {product.category.name}
                        </span>
                    </div>
                )}
                <button
                    onClick={(e) => { e.preventDefault(); onToggle(product.id); }}
                    className={`absolute top-2 right-2 w-7 h-7 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${inWishlist ? 'bg-gold/80 text-white' : 'bg-background/60 text-muted-foreground hover:text-destructive'}`}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <Heart className="w-3 h-3" strokeWidth={1.5} fill={inWishlist ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className="p-3">
                {product.brand && (
                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-0.5">{product.brand.name}</p>
                )}
                <h3 className="font-display text-sm text-foreground leading-tight mb-1 truncate group-hover:text-gold transition-colors">{product.name}</h3>
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

export default function PortalCatalog({ products, brands, categories, wishlistIds, filters }: Props) {
    const [localWishlist, setLocalWishlist] = useState<number[]>(wishlistIds);
    const [showFilters, setShowFilters] = useState(false);

    const selectedCategory = filters.category_slug ?? '';

    function applyFilter(key: string, value: string | undefined) {
        router.get(catalog(), { ...filters, [key]: value }, { preserveState: true, replace: true });
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

    const activeCategoryName = categories.find((c) => c.slug === selectedCategory)?.name ?? 'Collection';

    return (
        <>
            <Head title={`${activeCategoryName} — The Reserved Collection`} />

            <div className="pt-6 pb-16">
                <div className="container mx-auto px-6">
                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-gold font-body font-light tracking-[0.25em] uppercase text-[10px] mb-2">Browse Collection</p>
                        <h1 className="font-display text-3xl md:text-4xl font-light text-foreground">{activeCategoryName}</h1>
                    </div>

                    {/* Category tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none' }}>
                        <button
                            onClick={() => applyFilter('category_slug', undefined)}
                            className={`shrink-0 px-4 py-2 text-[10px] font-body font-medium tracking-[0.15em] uppercase border transition-all ${
                                !filters.category_slug
                                    ? 'border-gold bg-gold/10 text-gold'
                                    : 'border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'
                            }`}
                        >
                            All
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => applyFilter('category_slug', c.slug)}
                                className={`shrink-0 px-4 py-2 text-[10px] font-body font-medium tracking-[0.15em] uppercase border transition-all ${
                                    filters.category_slug === c.slug
                                        ? 'border-gold bg-gold/10 text-gold'
                                        : 'border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'
                                }`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    {/* Brand tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: 'none' }}>
                        <button
                            onClick={() => applyFilter('brand_id', undefined)}
                            className={`shrink-0 px-4 py-2 text-[10px] font-body font-medium tracking-[0.15em] uppercase border transition-all ${
                                !filters.brand_id
                                    ? 'border-gold bg-gold/10 text-gold'
                                    : 'border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'
                            }`}
                        >
                            All Brands
                        </button>
                        {brands.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => applyFilter('brand_id', b.id.toString())}
                                className={`shrink-0 px-4 py-2 text-[10px] font-body font-medium tracking-[0.15em] uppercase border transition-all ${
                                    filters.brand_id === b.id.toString()
                                        ? 'border-gold bg-gold/10 text-gold'
                                        : 'border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'
                                }`}
                            >
                                {b.name}
                            </button>
                        ))}
                    </div>

                    {/* Search toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 text-[10px] font-body font-medium text-muted-foreground hover:text-gold tracking-[0.15em] uppercase mb-4 transition-colors"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        {showFilters ? 'Hide' : 'Show'} Search
                    </button>

                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mb-8 p-4 bg-card border border-border overflow-hidden"
                        >
                            <input
                                autoFocus
                                type="text"
                                defaultValue={filters.search ?? ''}
                                placeholder="Search pieces by name…"
                                className="w-full max-w-sm bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground/50 border-b border-border focus:border-gold outline-none pb-1 tracking-wide transition-colors"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilter('search', (e.target as HTMLInputElement).value || undefined);
                                    }
                                }}
                            />
                        </motion.div>
                    )}

                    <p className="text-muted-foreground text-[11px] font-body mb-6">
                        {products.meta.total} piece{products.meta.total !== 1 ? 's' : ''}
                    </p>

                    {/* Product Grid */}
                    {products.data.length === 0 ? (
                        <div className="text-center py-24">
                            <Package className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" strokeWidth={1} />
                            <h2 className="font-display text-lg font-light text-foreground mb-2">No pieces found</h2>
                            <p className="text-[11px] text-muted-foreground font-body">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.data.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <ProductCard
                                        product={product}
                                        inWishlist={localWishlist.includes(product.id)}
                                        onToggle={toggleWishlist}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {products.meta.last_page > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            {products.links.prev && (
                                <Link href={products.links.prev} className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 hover:text-gold transition-colors font-body">
                                    ← Previous
                                </Link>
                            )}
                            <span className="text-[11px] text-muted-foreground font-body">
                                Page {products.meta.current_page} of {products.meta.last_page}
                            </span>
                            {products.links.next && (
                                <Link href={products.links.next} className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 hover:text-gold transition-colors font-body">
                                    Next →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

PortalCatalog.layout = (page: React.ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);
