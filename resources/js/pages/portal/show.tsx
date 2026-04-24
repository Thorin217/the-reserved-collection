import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, BadgeCheck, CheckCircle2, Clock, HandshakeIcon, Heart, Package, Share2, Shield, ShieldCheck, X, ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import * as CartController from '@/actions/App/Http/Controllers/Portal/CartController';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import { store as storeVerification } from '@/actions/App/Http/Controllers/Portal/CollectorVerificationController';
import { store as storeNegotiation } from '@/routes/portal/product-negotiations';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { auctionHouse, catalog } from '@/routes/portal';
import type { Auth } from '@/types';

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
    attribute_values?: Array<{ label: string; value: string | null; sort_order: number }>;
};

type ActiveNegotiation = {
    id: number;
    status: 'pending' | 'active';
    initial_offer: string | null;
    created_at: string;
};

type Props = {
    product: PortalProduct;
    inWishlist: boolean;
    related: PortalProduct[];
    collectorStatus: 'verified' | 'pending' | 'approved' | 'rejected' | 'none' | null;
    activeNegotiation: ActiveNegotiation | null;
};

function formatPrice(price: string | null): string {
    if (!price) return 'Price on request';
    return formatCurrency(price);
}


// ─── Verification Request Dialog ─────────────────────────────────────────────

type VerificationDialogProps = {
    onClose: () => void;
};

function VerificationDialog({ onClose }: VerificationDialogProps) {
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit() {
        setSubmitting(true);
        router.post(
            storeVerification.url(),
            { message },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Verification request submitted');
                    onClose();
                },
                onError: () => setSubmitting(false),
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-gold" />
                        <h3 className="font-display text-lg text-foreground">Request Collector Access</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mb-4 border border-border bg-secondary/50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                        <Shield className="h-3 w-3 text-gold" />
                        <p className="font-body text-[9px] tracking-[0.2em] text-gold uppercase">Verified Collector Program</p>
                    </div>
                    <p className="font-body text-[10px] leading-relaxed text-muted-foreground">
                        Live price negotiation is available to verified collectors. Our team will review your request within 24 hours.
                    </p>
                </div>

                <div className="mb-3">
                    <label className="mb-1.5 block font-body text-[9px] tracking-wider text-muted-foreground uppercase">
                        Tell us about your collection (optional)
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe your collecting experience, areas of interest..."
                        rows={4}
                        className="w-full resize-none border border-border bg-background px-3 py-2 font-body text-xs text-foreground transition-colors focus:border-gold focus:outline-none"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-gold py-2.5 font-body text-[10px] font-medium tracking-[0.15em] text-accent-foreground uppercase transition-colors hover:bg-gold-dark disabled:opacity-60"
                >
                    {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
            </div>
        </div>
    );
}

// ─── Negotiation Dialog ───────────────────────────────────────────────────────

type NegotiationDialogProps = {
    product: PortalProduct;
    selectedVariant: Variant | null;
    onClose: () => void;
};

function NegotiationDialog({ product, selectedVariant, onClose }: NegotiationDialogProps) {
    const [offer, setOffer] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit() {
        if (!offer) return;
        setSubmitting(true);
        router.post(
            storeNegotiation.url(product),
            {
                initial_offer: offer,
                message,
                product_variant_id: selectedVariant?.id ?? null,
            },
            {
                preserveScroll: true,
                onError: () => setSubmitting(false),
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
            <div className="mx-4 w-full max-w-md border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-gold" />
                        <h3 className="font-display text-lg text-foreground">Make an Offer</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="mb-0.5 font-body text-[9px] tracking-wider text-muted-foreground uppercase">Negotiating for</p>
                    <p className="font-body text-xs text-foreground">
                        {product.brand?.name ? `${product.brand.name} — ` : ''}
                        {product.name}
                    </p>
                    <p className="font-body text-[10px] text-muted-foreground">Ref. {product.sku}</p>
                </div>

                <div className="mb-3">
                    <label className="mb-1.5 block font-body text-[9px] tracking-wider text-muted-foreground uppercase">
                        Your offer *
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={offer}
                        onChange={(e) => setOffer(e.target.value)}
                        placeholder="Enter your offer amount..."
                        className="w-full border border-border bg-background px-3 py-2 font-body text-sm text-foreground transition-colors focus:border-gold focus:outline-none"
                    />
                </div>

                <div className="mb-4">
                    <label className="mb-1.5 block font-body text-[9px] tracking-wider text-muted-foreground uppercase">
                        Message (optional)
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add any context or questions..."
                        rows={3}
                        className="w-full resize-none border border-border bg-background px-3 py-2 font-body text-xs text-foreground transition-colors focus:border-gold focus:outline-none"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || !offer}
                    className="w-full bg-gold py-2.5 font-body text-[10px] font-medium tracking-[0.15em] text-accent-foreground uppercase transition-colors hover:bg-gold-dark disabled:opacity-60"
                >
                    {submitting ? 'Submitting…' : 'Submit Offer'}
                </button>
            </div>
        </div>
    );
}

// ─── Negotiate Button ─────────────────────────────────────────────────────────

type NegotiateButtonProps = {
    isAuth: boolean;
    collectorStatus: Props['collectorStatus'];
    activeNegotiation: ActiveNegotiation | null;
    product: PortalProduct;
    selectedVariant: Variant | null;
};

function NegotiateButton({ isAuth, collectorStatus, activeNegotiation, product, selectedVariant }: NegotiateButtonProps) {
    const [showVerification, setShowVerification] = useState(false);
    const [showNegotiation, setShowNegotiation] = useState(false);

    function handleClick() {
        if (!isAuth) {
            router.visit('/login');
            return;
        }

        if (collectorStatus === 'verified') {
            if (activeNegotiation) return; // handled inline
            setShowNegotiation(true);
            return;
        }

        if (collectorStatus === 'pending') return; // handled inline
        setShowVerification(true);
    }

    if (collectorStatus === 'pending') {
        return (
            <div className="relative group">
                <button
                    className="flex h-full w-12 cursor-not-allowed items-center justify-center border border-border text-muted-foreground/40"
                    title="Verification pending"
                    aria-label="Verification pending"
                >
                    <HandshakeIcon className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap border border-border bg-card px-2 py-1 font-body text-[9px] text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    Verification pending
                </span>
            </div>
        );
    }

    if (collectorStatus === 'verified' && activeNegotiation) {
        return (
            <Link
                href={auctionHouse({ query: { view: 'negotiation', negotiation: activeNegotiation.id } }).url}
                className="flex w-12 items-center justify-center border border-gold/50 text-gold"
                title="View active negotiation"
                aria-label="View active negotiation"
            >
                <HandshakeIcon className="h-4 w-4" strokeWidth={1.5} />
            </Link>
        );
    }

    return (
        <>
            <button
                onClick={handleClick}
                className="flex w-12 items-center justify-center border border-border text-muted-foreground transition-all hover:border-gold hover:text-gold"
                title={collectorStatus === 'verified' ? 'Make an offer' : 'Request collector access'}
                aria-label={collectorStatus === 'verified' ? 'Make an offer' : 'Request collector access'}
            >
                <HandshakeIcon className="h-4 w-4" strokeWidth={1.5} />
            </button>

            {showVerification && <VerificationDialog onClose={() => setShowVerification(false)} />}
            {showNegotiation && (
                <NegotiationDialog
                    product={product}
                    selectedVariant={selectedVariant}
                    onClose={() => setShowNegotiation(false)}
                />
            )}
        </>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductShow({ product, inWishlist: initialWishlist, related, collectorStatus, activeNegotiation }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAuth = !!auth?.user;

    const [wishlistState, setWishlistState] = useState(initialWishlist);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
        product.variants?.find((v) => v.is_active) ?? null,
    );
    const [addingToCart, setAddingToCart] = useState(false);
    const [shareTooltip, setShareTooltip] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen]);

    const activePrice = selectedVariant?.price ?? product.price;
    const activeCompare = selectedVariant?.compare_price ?? product.compare_price;
    const savings =
        activePrice && activeCompare && Number(activeCompare) > Number(activePrice)
            ? Number(activeCompare) - Number(activePrice)
            : null;
    const discount = savings && activeCompare ? Math.round((savings / Number(activeCompare)) * 100) : null;

    const backHref = product.category?.slug ? catalog({ query: { category_slug: product.category.slug } }) : catalog();

    function toggleWishlist() {
        if (!isAuth) { router.visit('/login'); return; }
        router.post(
            WishlistController.toggle.url({ product: product.id }),
            {},
            { preserveScroll: true, onSuccess: () => setWishlistState((prev) => !prev) },
        );
    }

    function addToCart() {
        if (!selectedVariant) return;
        if (!isAuth) { router.visit('/login'); return; }
        setAddingToCart(true);
        router.post(
            CartController.store.url(),
            { product_variant_id: selectedVariant.id, quantity: 1 },
            {
                preserveScroll: true,
                onSuccess: () => { toast.success('Added to cart', { description: product.name }); },
                onFinish: () => setAddingToCart(false),
            },
        );
    }

    function handleShare() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setShareTooltip(true);
            setTimeout(() => setShareTooltip(false), 2000);
        });
    }

    const specs = [
        ...(product.attribute_values?.filter((a) => a.value).map((a) => ({ label: a.label, value: a.value! })) ?? []),
        { label: 'SKU / Reference', value: product.sku },
        { label: 'Authentication', value: product.has_serial_numbers ? 'Serial number verified' : 'Authenticated' },
    ].filter((s) => s.value);

    return (
        <>
            <Head title={`${product.name} — The Reserved Collection`} />

            <div className="pb-16 pt-6">
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
                        {/* ── Image ── */}
                        <div
                            className={`group relative aspect-square overflow-hidden border border-border bg-card${product.image_url ? ' cursor-zoom-in' : ''}`}
                            onClick={() => product.image_url && setLightboxOpen(true)}
                        >
                            {product.image_url ? (
                                <>
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-20 w-20 text-muted-foreground/15" strokeWidth={1} />
                                </div>
                            )}
                        </div>

                        {/* ── Details ── */}
                        <div>
                            {product.brand && (
                                <p className="mb-1 font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                    {product.brand.name}
                                </p>
                            )}
                            <h1 className="mb-3 font-display text-3xl text-foreground md:text-4xl">{product.name}</h1>
                            <p className="mb-4 font-body text-[10px] text-muted-foreground">Ref. {product.sku}</p>

                            {/* Price */}
                            <div className="mb-4 flex items-center gap-3">
                                <span className="font-display text-3xl text-gold">{formatPrice(activePrice)}</span>
                                {activeCompare && Number(activeCompare) > Number(activePrice) && (
                                    <span className="font-body text-lg text-muted-foreground line-through">
                                        {formatPrice(activeCompare)}
                                    </span>
                                )}
                            </div>

                            {savings && discount && (
                                <div className="mb-6 border border-green-500/20 bg-green-500/10 px-3 py-2">
                                    <span className="font-body text-[10px] font-medium tracking-wider text-green-500 uppercase">
                                        Save {formatPrice(savings.toString())} — {discount}% off
                                    </span>
                                </div>
                            )}

                            {product.description && (
                                <p className="mb-8 font-body text-sm font-light leading-relaxed text-foreground/70">
                                    {product.description}
                                </p>
                            )}

                            {/* Variant selector */}
                            {product.variants && product.variants.filter((v) => v.is_active).length > 1 && (
                                <div className="mb-6">
                                    <p className="mb-2 font-body text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Options</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants
                                            .filter((v) => v.is_active)
                                            .map((variant) => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => setSelectedVariant(variant)}
                                                    className={`border px-4 py-2 font-body text-[10px] tracking-wider transition-all ${selectedVariant?.id === variant.id ? 'border-gold bg-gold/10 text-gold' : 'border-border text-foreground/60 hover:border-gold/40'}`}
                                                >
                                                    {variant.attribute_summary ?? variant.sku}
                                                    {variant.price && ` — ${formatPrice(variant.price)}`}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mb-6 flex gap-3">
                                {selectedVariant ? (
                                    <button
                                        onClick={addToCart}
                                        disabled={addingToCart}
                                        className="flex-1 bg-gold py-3 font-body text-[10px] font-medium tracking-[0.15em] text-primary-foreground uppercase transition-all hover:bg-gold-dark disabled:opacity-60"
                                    >
                                        {addingToCart ? 'Adding…' : 'Add to Cart'}
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="flex-1 cursor-not-allowed border border-border py-3 font-body text-[10px] font-medium tracking-[0.15em] text-foreground/40 uppercase"
                                    >
                                        Unavailable
                                    </button>
                                )}

                                {/* Wishlist */}
                                <button
                                    onClick={toggleWishlist}
                                    className={`flex w-12 items-center justify-center border transition-all ${wishlistState ? 'border-gold text-gold' : 'border-border text-muted-foreground hover:border-gold hover:text-gold'}`}
                                    aria-label={wishlistState ? 'Remove from wishlist' : 'Save to wishlist'}
                                >
                                    <Heart className="h-4 w-4" strokeWidth={1.5} fill={wishlistState ? 'currentColor' : 'none'} />
                                </button>

                                {/* Share */}
                                <div className="relative">
                                    <button
                                        onClick={handleShare}
                                        className="flex h-full w-12 items-center justify-center border border-border text-muted-foreground transition-all hover:border-gold hover:text-gold"
                                        aria-label="Copy link"
                                    >
                                        <Share2 className="h-4 w-4" strokeWidth={1.5} />
                                    </button>
                                    {shareTooltip && (
                                        <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap border border-border bg-card px-2 py-1 font-body text-[9px] text-foreground">
                                            Link copied
                                        </span>
                                    )}
                                </div>

                                {/* Negotiate */}
                                <NegotiateButton
                                    isAuth={isAuth}
                                    collectorStatus={collectorStatus}
                                    activeNegotiation={activeNegotiation}
                                    product={product}
                                    selectedVariant={selectedVariant}
                                />
                            </div>

                            {/* Collector status notice */}
                            {isAuth && collectorStatus === 'pending' && (
                                <div className="mb-6 flex items-start gap-2 border border-gold/20 bg-gold/5 px-3 py-2">
                                    <Clock className="mt-0.5 h-3 w-3 shrink-0 text-gold" strokeWidth={1.5} />
                                    <p className="font-body text-[10px] leading-relaxed text-foreground/70">
                                        Your collector verification request is under review. You'll be notified once approved.
                                    </p>
                                </div>
                            )}

                            {isAuth && collectorStatus === 'rejected' && (
                                <div className="mb-6 flex items-start gap-2 border border-destructive/20 bg-destructive/5 px-3 py-2">
                                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" strokeWidth={1.5} />
                                    <p className="font-body text-[10px] leading-relaxed text-foreground/70">
                                        Your previous collector request was not approved. You may submit a new request via the{' '}
                                        <button
                                            onClick={() => {}}
                                            className="text-gold underline-offset-2 hover:underline"
                                        >
                                            negotiate button
                                        </button>.
                                    </p>
                                </div>
                            )}

                            {isAuth && collectorStatus === 'verified' && activeNegotiation && (
                                <div className="mb-6 flex items-start gap-2 border border-gold/20 bg-gold/5 px-3 py-2">
                                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-gold" strokeWidth={1.5} />
                                    <p className="font-body text-[10px] leading-relaxed text-foreground/70">
                                        You have an{' '}
                                        <Link
                                            href={auctionHouse({ query: { view: 'negotiation', negotiation: activeNegotiation.id } }).url}
                                            className="text-gold underline-offset-2 hover:underline"
                                        >
                                            active negotiation
                                        </Link>{' '}
                                        for this product.
                                    </p>
                                </div>
                            )}

                            {/* Trust line */}
                            <div className="mb-8 flex items-center gap-2 font-body text-[10px] text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
                                Authenticity verified · Insured shipping · Buyer protection
                            </div>

                            {/* Specs table */}
                            <div className="border border-border">
                                <div className="border-b border-border p-4">
                                    <p className="font-body text-[9px] font-medium tracking-[0.2em] text-gold uppercase">Specifications</p>
                                </div>
                                {specs.map((s, i) => (
                                    <div
                                        key={s.label}
                                        className={`flex items-center justify-between px-4 py-2.5 ${i < specs.length - 1 ? 'border-b border-border' : ''}`}
                                    >
                                        <span className="font-body text-[10px] text-muted-foreground">{s.label}</span>
                                        <span className="max-w-[60%] text-right font-body text-[11px] font-medium text-foreground">
                                            {s.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Market Analytics placeholder */}
                    <div className="mt-12 border border-border bg-card p-6">
                        <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                            Market Analytics
                        </p>
                        <h2 className="mb-4 font-display text-2xl font-light text-foreground">Price History</h2>
                        <div className="flex h-32 items-center justify-center border border-dashed border-border text-muted-foreground/40">
                            <p className="font-body text-[10px] tracking-wider uppercase">Price chart — coming soon</p>
                        </div>
                    </div>

                    {/* Related Products */}
                    {related.length > 0 && (
                        <div className="mt-16">
                            <p className="mb-2 font-body text-[10px] font-light tracking-[0.25em] text-gold uppercase">
                                Similar Pieces
                            </p>
                            <h2 className="mb-6 font-display text-2xl font-light text-foreground">You May Also Like</h2>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {related.map((item) => (
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
                                                    <Package className="h-8 w-8 text-muted-foreground/15" strokeWidth={1} />
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
                                            <p className="font-body text-sm font-semibold text-gold">{formatPrice(item.price)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && product.image_url && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        className="absolute right-5 top-5 text-white/60 transition-colors hover:text-white"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

ProductShow.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
