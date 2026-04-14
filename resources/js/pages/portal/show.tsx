import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Heart, Package, Share2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import * as CartController from '@/actions/App/Http/Controllers/Portal/CartController';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import { formatCurrency } from '@/lib/currency';
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
    if (!price) {
        return 'Price on request';
    }

    return formatCurrency(price);
}

export default function ProductShow({
    product,
    inWishlist: initialWishlist,
    related,
}: Props) {
    const [wishlistState, setWishlistState] = useState(initialWishlist);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
        product.variants?.find((v) => v.is_active) ?? null,
    );
    const [addingToCart, setAddingToCart] = useState(false);

    const activePrice = selectedVariant?.price ?? product.price;
    const activeCompare =
        selectedVariant?.compare_price ?? product.compare_price;
    const savings =
        activePrice &&
        activeCompare &&
        Number(activeCompare) > Number(activePrice)
            ? Number(activeCompare) - Number(activePrice)
            : null;
    const discount =
        savings && activeCompare
            ? Math.round((savings / Number(activeCompare)) * 100)
            : null;

    const backHref = product.category?.slug
        ? catalog({ query: { category_slug: product.category.slug } })
        : catalog();

    function toggleWishlist() {
        router.post(
            WishlistController.toggle.url({ product: product.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setWishlistState((prev) => !prev),
            },
        );
    }

    function addToCart() {
        if (!selectedVariant) {
            return;
        }
        setAddingToCart(true);
        router.post(
            CartController.store.url(),
            {
                product_variant_id: selectedVariant.id,
                quantity: 1,
            },
            {
                preserveScroll: true,
                onFinish: () => setAddingToCart(false),
            },
        );
    }

    const specs = [
        { label: 'SKU / Reference', value: product.sku },
        { label: 'Type', value: product.product_type?.replace('_', ' ') },
        { label: 'Brand', value: product.brand?.name },
        { label: 'Category', value: product.category?.name },
        {
            label: 'Authentication',
            value: product.has_serial_numbers
                ? 'Serial number verified'
                : 'Authenticated',
        },
    ].filter((s) => s.value);

    return (
        <>
            <Head title={`${product.name} — The Reserved Collection`} />

            <div className="pt-6 pb-16">
                <div className="container mx-auto px-6">
                    {/* Back */}
                    <Link
                        href={backHref}
                        className="mb-8 inline-flex items-center gap-2 font-body text-[10px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-gold"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to {product.category?.name ?? 'Catalog'}
                    </Link>

                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                        {/* Image */}
                        <div className="aspect-square overflow-hidden border border-border bg-card">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Package
                                        className="h-20 w-20 text-muted-foreground/15"
                                        strokeWidth={1}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div>
                            {product.brand && (
                                <p className="mb-1 font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                    {product.brand.name}
                                </p>
                            )}
                            <h1 className="mb-3 font-display text-3xl text-foreground md:text-4xl">
                                {product.name}
                            </h1>
                            <p className="mb-4 font-body text-[10px] text-muted-foreground">
                                Ref. {product.sku}
                            </p>

                            {/* Price */}
                            <div className="mb-4 flex items-center gap-3">
                                <span className="font-display text-3xl text-gold">
                                    {formatPrice(activePrice)}
                                </span>
                                {activeCompare &&
                                    Number(activeCompare) >
                                        Number(activePrice) && (
                                        <span className="font-body text-lg text-muted-foreground line-through">
                                            {formatPrice(activeCompare)}
                                        </span>
                                    )}
                            </div>

                            {savings && discount && (
                                <div className="mb-6 border border-green-500/20 bg-green-500/10 px-3 py-2">
                                    <span className="font-body text-[10px] font-medium tracking-wider text-green-500 uppercase">
                                        Save {formatPrice(savings.toString())} —{' '}
                                        {discount}% off
                                    </span>
                                </div>
                            )}

                            {product.description && (
                                <p className="mb-8 font-body text-sm leading-relaxed font-light text-foreground/70">
                                    {product.description}
                                </p>
                            )}

                            {/* Variant selector */}
                            {product.variants &&
                                product.variants.filter((v) => v.is_active)
                                    .length > 1 && (
                                    <div className="mb-6">
                                        <p className="mb-2 font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                            Options
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {product.variants
                                                .filter((v) => v.is_active)
                                                .map((variant) => (
                                                    <button
                                                        key={variant.id}
                                                        onClick={() =>
                                                            setSelectedVariant(
                                                                variant,
                                                            )
                                                        }
                                                        className={`border px-4 py-2 font-body text-[10px] tracking-wider transition-all ${selectedVariant?.id === variant.id ? 'border-gold bg-gold/10 text-gold' : 'border-border text-foreground/60 hover:border-gold/40'}`}
                                                    >
                                                        {variant.attribute_summary ??
                                                            variant.sku}
                                                        {variant.price &&
                                                            ` — ${formatPrice(variant.price)}`}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}

                            {/* Actions */}
                            <div className="mb-8 flex gap-3">
                                {selectedVariant ? (
                                    <button
                                        onClick={addToCart}
                                        disabled={addingToCart}
                                        className="flex-1 bg-gold py-3 font-body text-[10px] font-medium tracking-[0.15em] text-primary-foreground uppercase transition-all hover:bg-gold-dark disabled:opacity-60"
                                    >
                                        {addingToCart
                                            ? 'Adding…'
                                            : 'Add to Cart'}
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="flex-1 cursor-not-allowed border border-border py-3 font-body text-[10px] font-medium tracking-[0.15em] text-foreground/40 uppercase"
                                    >
                                        Unavailable
                                    </button>
                                )}
                                <button
                                    onClick={toggleWishlist}
                                    className={`flex w-12 items-center justify-center border transition-all ${wishlistState ? 'border-gold text-gold' : 'border-border text-muted-foreground hover:border-gold hover:text-gold'}`}
                                    aria-label={
                                        wishlistState
                                            ? 'Remove from wishlist'
                                            : 'Save to wishlist'
                                    }
                                >
                                    <Heart
                                        className="h-4 w-4"
                                        strokeWidth={1.5}
                                        fill={
                                            wishlistState
                                                ? 'currentColor'
                                                : 'none'
                                        }
                                    />
                                </button>
                                <button className="flex w-12 items-center justify-center border border-border text-muted-foreground transition-all hover:border-gold hover:text-gold">
                                    <Share2
                                        className="h-4 w-4"
                                        strokeWidth={1.5}
                                    />
                                </button>
                            </div>

                            {/* Trust line */}
                            <div className="mb-8 flex items-center gap-2 font-body text-[10px] text-muted-foreground">
                                <ShieldCheck
                                    className="h-3.5 w-3.5 text-gold"
                                    strokeWidth={1.5}
                                />
                                Authenticity verified · Insured shipping · Buyer
                                protection
                            </div>

                            {/* Specs table */}
                            <div className="border border-border">
                                <div className="border-b border-border p-4">
                                    <p className="font-body text-[9px] font-medium tracking-[0.2em] text-gold uppercase">
                                        Specifications
                                    </p>
                                </div>
                                {specs.map((s, i) => (
                                    <div
                                        key={s.label}
                                        className={`flex items-center justify-between px-4 py-2.5 ${i < specs.length - 1 ? 'border-b border-border' : ''}`}
                                    >
                                        <span className="font-body text-[10px] text-muted-foreground">
                                            {s.label}
                                        </span>
                                        <span className="font-body text-[11px] font-medium text-foreground">
                                            {s.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Price History — TODO: wire up real price history data */}
                    <div className="mt-12 border border-border bg-card p-6">
                        <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                            Market Analytics
                        </p>
                        <h2 className="mb-4 font-display text-2xl font-light text-foreground">
                            Price History
                        </h2>
                        <div className="flex h-32 items-center justify-center border border-dashed border-border text-muted-foreground/40">
                            <p className="font-body text-[10px] tracking-wider uppercase">
                                Price chart — coming soon
                            </p>
                        </div>
                    </div>

                    {/* Related Products */}
                    {related.data.length > 0 && (
                        <div className="mt-16">
                            <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                                Similar Pieces
                            </p>
                            <h2 className="mb-6 font-display text-2xl font-light text-foreground">
                                You May Also Like
                            </h2>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {related.data.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/products/${item.slug}`}
                                        className="group border border-border bg-card transition-all hover:border-gold/25"
                                    >
                                        <div className="aspect-square overflow-hidden">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-secondary">
                                                    <Package
                                                        className="h-8 w-8 text-muted-foreground/15"
                                                        strokeWidth={1}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            {item.brand && (
                                                <p className="mb-0.5 font-body text-[8px] tracking-[0.2em] text-muted-foreground uppercase">
                                                    {item.brand.name}
                                                </p>
                                            )}
                                            <p className="mb-2 line-clamp-2 font-display text-xs text-foreground transition-colors group-hover:text-gold">
                                                {item.name}
                                            </p>
                                            <p className="font-body text-sm font-semibold text-gold">
                                                {formatPrice(item.price)}
                                            </p>
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
