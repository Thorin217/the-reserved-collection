import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Heart, Package, Share2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import * as CartController from '@/actions/App/Http/Controllers/Portal/CartController';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import PortalLayout from '@/layouts/portal-layout';
import { catalog } from '@/routes/portal';

type Variant = {
    id: number;
    sku: string;
    price: string | null;
    compare_price: string | null;
    attribute_summary: string | null;
    is_active: boolean;
};

type PortalProduct = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    description: string | null;
    product_type: string;
    has_serial_numbers: boolean;
    brand?: { id: number; name: string; slug: string };
    category?: { id: number; name: string; slug: string };
    price: string | null;
    compare_price: string | null;
    image_url: string;
    variants?: Variant[];
};

type Props = {
    product: PortalProduct;
    inWishlist: boolean;
    related: { data: PortalProduct[] };
};

function formatPrice(price: string | null): string {
    if (!price) { return 'Price on request'; }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(price));
}

export default function ProductShow({ product, inWishlist: initialWishlist, related }: Props) {
    const [wishlistState, setWishlistState] = useState(initialWishlist);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
        product.variants?.find((v) => v.is_active) ?? null,
    );
    const [addingToCart, setAddingToCart] = useState(false);

    const activePrice = selectedVariant?.price ?? product.price;
    const activeCompare = selectedVariant?.compare_price ?? product.compare_price;
    const savings = activePrice && activeCompare && Number(activeCompare) > Number(activePrice)
        ? Number(activeCompare) - Number(activePrice)
        : null;
    const discount = savings && activeCompare
        ? Math.round((savings / Number(activeCompare)) * 100)
        : null;

    const backHref = product.category?.slug
        ? catalog({ query: { category_slug: product.category.slug } })
        : catalog();

    function toggleWishlist() {
        router.post(WishlistController.toggle.url({ product: product.id }), {}, {
            preserveScroll: true,
            onSuccess: () => setWishlistState((prev) => !prev),
        });
    }

    function addToCart() {
        if (!selectedVariant) { return; }
        setAddingToCart(true);
        router.post(CartController.store.url(), {
            product_variant_id: selectedVariant.id,
            quantity: 1,
        }, {
            preserveScroll: true,
            onFinish: () => setAddingToCart(false),
        });
    }

    const specs = [
        { label: 'SKU / Reference', value: product.sku },
        { label: 'Type', value: product.product_type?.replace('_', ' ') },
        { label: 'Brand', value: product.brand?.name },
        { label: 'Category', value: product.category?.name },
        { label: 'Authentication', value: product.has_serial_numbers ? 'Serial number verified' : 'Authenticated' },
    ].filter((s) => s.value);

    return (
        <>
            <Head title={`${product.name} — The Reserved Collection`} />

            <div className="pt-6 pb-16">
                <div className="container mx-auto px-6">
                    {/* Back */}
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold text-[10px] font-body tracking-[0.15em] uppercase mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to {product.category?.name ?? 'Catalog'}
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Image */}
                        <div className="aspect-square bg-card border border-border overflow-hidden">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-20 h-20 text-muted-foreground/15" strokeWidth={1} />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div>
                            {product.brand && (
                                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-1">
                                    {product.brand.name}
                                </p>
                            )}
                            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">{product.name}</h1>
                            <p className="text-[10px] text-muted-foreground font-body mb-4">Ref. {product.sku}</p>

                            {/* Price */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="font-display text-3xl text-gold">{formatPrice(activePrice)}</span>
                                {activeCompare && Number(activeCompare) > Number(activePrice) && (
                                    <span className="text-lg font-body text-muted-foreground line-through">{formatPrice(activeCompare)}</span>
                                )}
                            </div>

                            {savings && discount && (
                                <div className="bg-green-500/10 border border-green-500/20 px-3 py-2 mb-6">
                                    <span className="text-[10px] font-body font-medium text-green-500 tracking-wider uppercase">
                                        Save {formatPrice(savings.toString())} — {discount}% off
                                    </span>
                                </div>
                            )}

                            {product.description && (
                                <p className="text-foreground/70 font-body font-light text-sm leading-relaxed mb-8">
                                    {product.description}
                                </p>
                            )}

                            {/* Variant selector */}
                            {product.variants && product.variants.filter((v) => v.is_active).length > 1 && (
                                <div className="mb-6">
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-body mb-2">Options</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants.filter((v) => v.is_active).map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => setSelectedVariant(variant)}
                                                className={`px-4 py-2 border text-[10px] font-body tracking-wider transition-all ${selectedVariant?.id === variant.id ? 'border-gold bg-gold/10 text-gold' : 'border-border text-foreground/60 hover:border-gold/40'}`}
                                            >
                                                {variant.attribute_summary ?? variant.sku}
                                                {variant.price && ` — ${formatPrice(variant.price)}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 mb-8">
                                {selectedVariant ? (
                                    <button
                                        onClick={addToCart}
                                        disabled={addingToCart}
                                        className="flex-1 bg-gold hover:bg-gold-dark text-primary-foreground py-3 text-[10px] font-body font-medium tracking-[0.15em] uppercase transition-all disabled:opacity-60"
                                    >
                                        {addingToCart ? 'Adding…' : 'Add to Cart'}
                                    </button>
                                ) : (
                                    <button disabled className="flex-1 border border-border text-foreground/40 py-3 text-[10px] font-body font-medium tracking-[0.15em] uppercase cursor-not-allowed">
                                        Unavailable
                                    </button>
                                )}
                                <button
                                    onClick={toggleWishlist}
                                    className={`w-12 border flex items-center justify-center transition-all ${wishlistState ? 'border-gold text-gold' : 'border-border text-muted-foreground hover:text-gold hover:border-gold'}`}
                                    aria-label={wishlistState ? 'Remove from wishlist' : 'Save to wishlist'}
                                >
                                    <Heart className="w-4 h-4" strokeWidth={1.5} fill={wishlistState ? 'currentColor' : 'none'} />
                                </button>
                                <button className="w-12 border border-border text-muted-foreground hover:text-gold hover:border-gold transition-all flex items-center justify-center">
                                    <Share2 className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Trust line */}
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-body mb-8">
                                <ShieldCheck className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
                                Authenticity verified · Insured shipping · Buyer protection
                            </div>

                            {/* Specs table */}
                            <div className="border border-border">
                                <div className="p-4 border-b border-border">
                                    <p className="text-[9px] text-gold uppercase tracking-[0.2em] font-body font-medium">Specifications</p>
                                </div>
                                {specs.map((s, i) => (
                                    <div key={s.label} className={`flex items-center justify-between px-4 py-2.5 ${i < specs.length - 1 ? 'border-b border-border' : ''}`}>
                                        <span className="text-[10px] text-muted-foreground font-body">{s.label}</span>
                                        <span className="text-[11px] text-foreground font-body font-medium">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Price History — TODO: wire up real price history data */}
                    <div className="mt-12 p-6 bg-card border border-border">
                        <p className="text-gold font-body font-light tracking-[0.25em] uppercase text-[10px] mb-2">Market Analytics</p>
                        <h2 className="font-display text-2xl font-light text-foreground mb-4">Price History</h2>
                        <div className="h-32 flex items-center justify-center text-muted-foreground/40 border border-dashed border-border">
                            <p className="text-[10px] font-body tracking-wider uppercase">Price chart — coming soon</p>
                        </div>
                    </div>

                    {/* Related Products */}
                    {related.data.length > 0 && (
                        <div className="mt-16">
                            <p className="text-gold font-body font-light tracking-[0.25em] uppercase text-[10px] mb-2">Similar Pieces</p>
                            <h2 className="font-display text-2xl font-light text-foreground mb-6">You May Also Like</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {related.data.map((item) => (
                                    <Link key={item.id} href={`/products/${item.slug}`} className="group bg-card border border-border hover:border-gold/25 transition-all">
                                        <div className="aspect-square overflow-hidden">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-secondary">
                                                    <Package className="w-8 h-8 text-muted-foreground/15" strokeWidth={1} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            {item.brand && <p className="text-[8px] text-muted-foreground tracking-[0.2em] uppercase font-body mb-0.5">{item.brand.name}</p>}
                                            <p className="font-display text-xs text-foreground line-clamp-2 mb-2 group-hover:text-gold transition-colors">{item.name}</p>
                                            <p className="text-sm font-body font-semibold text-gold">{formatPrice(item.price)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ProductShow.layout = (page: React.ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);
