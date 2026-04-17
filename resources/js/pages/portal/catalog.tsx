import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Heart, Package, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import { formatCurrency } from '@/lib/currency';
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

type AttributeFilter = { code: string; name: string; values: string[] };

type Props = {
    products: PaginatedData<PortalProduct>;
    brands: SimpleModel[];
    categories: SimpleModel[];
    wishlistIds: number[];
    attributeFilters: AttributeFilter[];
    filters: {
        search?: string;
        brand_id?: string;
        category_slug?: string;
        attrs?: Record<string, string>;
    };
};

function formatPrice(price: string | null): string {
    if (!price) {
        return 'Price on request';
    }

    return formatCurrency(price);
}

function ProductCard({
    product,
    inWishlist,
    onToggle,
}: {
    product: PortalProduct;
    inWishlist: boolean;
    onToggle: (id: number) => void;
}) {
    return (
        <Link
            href={`/products/${product.slug}`}
            className="group block border border-border bg-card transition-all duration-300 hover:border-gold/25"
        >
            <div className="relative aspect-square overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                        <Package
                            className="h-10 w-10 text-muted-foreground/20"
                            strokeWidth={1}
                        />
                    </div>
                )}
                {product.category && (
                    <div className="absolute top-2 left-2">
                        <span className="bg-background/80 px-2 py-0.5 font-body text-[8px] font-medium tracking-wider text-gold uppercase backdrop-blur-sm">
                            {product.category.name}
                        </span>
                    </div>
                )}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onToggle(product.id);
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
            </div>
            <div className="p-3">
                {product.brand && (
                    <p className="mb-0.5 font-body text-[8px] tracking-[0.2em] text-muted-foreground uppercase">
                        {product.brand.name}
                    </p>
                )}
                <h3 className="mb-1 truncate font-display text-sm leading-tight text-foreground transition-colors group-hover:text-gold">
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

function FilterGroup({
    label,
    code,
    options,
    activeValue,
    onSelect,
}: {
    label: string;
    code: string;
    options: string[];
    activeValue: string | undefined;
    onSelect: (code: string, value: string | undefined) => void;
}) {
    return (
        <div>
            <p className="mb-2 font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                {label}
            </p>
            <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() =>
                            onSelect(code, activeValue === opt ? undefined : opt)
                        }
                        className={`border px-2.5 py-1 font-body text-[9px] tracking-wider transition-all ${
                            activeValue === opt
                                ? 'border-gold bg-gold/10 text-gold'
                                : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function PortalCatalog({
    products,
    brands,
    categories,
    wishlistIds,
    attributeFilters,
    filters,
}: Props) {
    const [localWishlist, setLocalWishlist] = useState<number[]>(wishlistIds);
    const activeAttrs = filters.attrs ?? {};
    const activeAttrCount = Object.values(activeAttrs).filter(Boolean).length;
    const [showFilters, setShowFilters] = useState(
        activeAttrCount > 0 || !!filters.search,
    );

    const selectedCategory = filters.category_slug ?? '';

    function applyFilter(key: string, value: string | undefined) {
        // Clear attribute filters when changing category
        const extra = key === 'category_slug' ? { attrs: undefined } : {};
        router.get(
            catalog(),
            { ...filters, ...extra, [key]: value },
            { preserveState: true, replace: true },
        );
    }

    function applyAttrFilter(code: string, value: string | undefined) {
        const newAttrs = { ...activeAttrs, [code]: value };
        if (!value) {
            delete newAttrs[code];
        }
        router.get(
            catalog(),
            { ...filters, attrs: Object.keys(newAttrs).length ? newAttrs : undefined },
            { preserveState: true, replace: true },
        );
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

    const activeCategoryName =
        categories.find((c) => c.slug === selectedCategory)?.name ??
        'Collection';

    return (
        <>
            <Head title={`${activeCategoryName} — The Reserved Collection`} />

            <div className="pt-6 pb-16">
                <div className="container mx-auto px-6">
                    {/* Header */}
                    <div className="mb-8">
                        <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                            Browse Collection
                        </p>
                        <h1 className="font-display text-3xl font-light text-foreground md:text-4xl">
                            {activeCategoryName}
                        </h1>
                    </div>

                    {/* Category tabs */}
                    <div
                        className="mb-4 flex gap-2 overflow-x-auto pb-3"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        <button
                            onClick={() =>
                                applyFilter('category_slug', undefined)
                            }
                            className={`shrink-0 border px-4 py-2 font-body text-[10px] font-medium tracking-[0.15em] uppercase transition-all ${
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
                                onClick={() =>
                                    applyFilter('category_slug', c.slug)
                                }
                                className={`shrink-0 border px-4 py-2 font-body text-[10px] font-medium tracking-[0.15em] uppercase transition-all ${
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
                    <div
                        className="mb-6 flex gap-2 overflow-x-auto pb-3"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        <button
                            onClick={() => applyFilter('brand_id', undefined)}
                            className={`shrink-0 border px-4 py-2 font-body text-[10px] font-medium tracking-[0.15em] uppercase transition-all ${
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
                                onClick={() =>
                                    applyFilter('brand_id', b.id.toString())
                                }
                                className={`shrink-0 border px-4 py-2 font-body text-[10px] font-medium tracking-[0.15em] uppercase transition-all ${
                                    filters.brand_id === b.id.toString()
                                        ? 'border-gold bg-gold/10 text-gold'
                                        : 'border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'
                                }`}
                            >
                                {b.name}
                            </button>
                        ))}
                    </div>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="mb-4 flex items-center gap-2 font-body text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-gold"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {showFilters ? 'Hide' : 'Show'} Filters
                        {activeAttrCount > 0 && (
                            <span className="flex h-4 w-4 items-center justify-center bg-gold font-body text-[8px] font-semibold text-background">
                                {activeAttrCount}
                            </span>
                        )}
                    </button>

                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mb-8 overflow-hidden border border-border bg-card p-4"
                        >
                            <div className="mb-4">
                                <input
                                    autoFocus
                                    type="text"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Search pieces by name…"
                                    className="w-full max-w-sm border-b border-border bg-transparent pb-1 font-body text-sm tracking-wide text-foreground transition-colors outline-none placeholder:text-muted-foreground/50 focus:border-gold"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilter(
                                                'search',
                                                (e.target as HTMLInputElement)
                                                    .value || undefined,
                                            );
                                        }
                                    }}
                                />
                            </div>

                            {attributeFilters.length > 0 && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {attributeFilters.map((filter) => (
                                        <FilterGroup
                                            key={filter.code}
                                            label={filter.name}
                                            code={filter.code}
                                            options={filter.values}
                                            activeValue={activeAttrs[filter.code]}
                                            onSelect={applyAttrFilter}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    <p className="mb-6 font-body text-[11px] text-muted-foreground">
                        {products.meta.total} piece
                        {products.meta.total !== 1 ? 's' : ''}
                    </p>

                    {/* Product Grid */}
                    {products.data.length === 0 ? (
                        <div className="py-24 text-center">
                            <Package
                                className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20"
                                strokeWidth={1}
                            />
                            <h2 className="mb-2 font-display text-lg font-light text-foreground">
                                No pieces found
                            </h2>
                            <p className="font-body text-[11px] text-muted-foreground">
                                Try adjusting your filters.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {products.data.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <ProductCard
                                        product={product}
                                        inWishlist={localWishlist.includes(
                                            product.id,
                                        )}
                                        onToggle={toggleWishlist}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {products.meta.last_page > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                            {products.links.prev && (
                                <Link
                                    href={products.links.prev}
                                    className="font-body text-[10px] tracking-[0.2em] text-foreground/50 uppercase transition-colors hover:text-gold"
                                >
                                    ← Previous
                                </Link>
                            )}
                            <span className="font-body text-[11px] text-muted-foreground">
                                Page {products.meta.current_page} of{' '}
                                {products.meta.last_page}
                            </span>
                            {products.links.next && (
                                <Link
                                    href={products.links.next}
                                    className="font-body text-[10px] tracking-[0.2em] text-foreground/50 uppercase transition-colors hover:text-gold"
                                >
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
