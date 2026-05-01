import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { catalog } from '@/routes/portal';
import { store as checkoutStore } from '@/routes/portal/checkout';

type CartItemData = {
    id: number;
    quantity: number;
    variant: { id: number; price: string | null; attribute_summary: string | null };
    product: { name: string; brand: string | null };
};

type Props = {
    cartItems: CartItemData[];
    subtotal: number;
};

function detectBrand(number: string): 'visa' | 'mastercard' | 'amex' | null {
    const clean = number.replace(/\s/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^5[1-5]/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    return null;
}

function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
        return digits.slice(0, 2) + '/' + digits.slice(2);
    }
    return digits;
}

export default function CheckoutPage({ cartItems, subtotal }: Props) {
    const [rawCardNumber, setRawCardNumber] = useState('');
    const brand = detectBrand(rawCardNumber);

    const { data, setData, post, processing, errors } = useForm({
        card_name: '',
        card_number: '',
        card_expiry: '',
        card_cvv: '',
    });

    function handleCardNumber(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
        setRawCardNumber(raw);
        const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
        setData('card_number', formatted);
    }

    function handleExpiry(e: React.ChangeEvent<HTMLInputElement>) {
        const formatted = formatExpiry(e.target.value);
        setData('card_expiry', formatted);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(checkoutStore());
    }

    const maskedNumber = rawCardNumber
        ? '•••• •••• •••• ' + rawCardNumber.slice(-4).padStart(4, '•')
        : '•••• •••• •••• ••••';

    return (
        <>
            <Head title="Checkout — The Reserved Collection" />

            <div className="container mx-auto max-w-5xl px-6 py-10">
                <FlashMessage />

                <div className="mb-8">
                    <p className="mb-2 text-[9px] font-light tracking-[0.3em] text-gold uppercase">
                        Secure Checkout
                    </p>
                    <h1 className="font-serif text-3xl font-light text-foreground">
                        Payment
                    </h1>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Payment form */}
                    <div className="lg:col-span-2">
                        {/* Card visual */}
                        <div className="mb-6 h-44 rounded-none bg-gradient-to-br from-zinc-800 to-neutral-900 p-6 shadow-xl">
                            <div className="flex h-full flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div className="h-8 w-12 rounded-sm bg-gradient-to-br from-gold/60 to-gold/20" />
                                    {brand === 'visa' && (
                                        <span className="font-serif text-xl font-bold italic text-white/80">VISA</span>
                                    )}
                                    {brand === 'mastercard' && (
                                        <div className="flex">
                                            <div className="h-7 w-7 rounded-full bg-red-500/80" />
                                            <div className="-ml-3 h-7 w-7 rounded-full bg-yellow-400/80" />
                                        </div>
                                    )}
                                    {brand === 'amex' && (
                                        <span className="text-xs font-bold tracking-widest text-white/70">AMEX</span>
                                    )}
                                    {!brand && (
                                        <Lock className="h-4 w-4 text-white/30" strokeWidth={1.5} />
                                    )}
                                </div>
                                <div>
                                    <p className="mb-3 font-mono text-lg tracking-[0.18em] text-white/80">
                                        {maskedNumber}
                                    </p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[8px] tracking-[0.2em] text-white/30 uppercase">
                                                Card holder
                                            </p>
                                            <p className="font-body text-sm text-white/70">
                                                {data.card_name || 'Full Name'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] tracking-[0.2em] text-white/30 uppercase">
                                                Expires
                                            </p>
                                            <p className="font-body text-sm text-white/70">
                                                {data.card_expiry || 'MM/YY'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                    Cardholder Name
                                </label>
                                <input
                                    type="text"
                                    value={data.card_name}
                                    onChange={(e) => setData('card_name', e.target.value)}
                                    placeholder="As it appears on the card"
                                    className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/40 focus:outline-none"
                                />
                                {errors.card_name && <p className="mt-1 text-xs text-destructive">{errors.card_name}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                    Card Number
                                </label>
                                <input
                                    type="text"
                                    value={data.card_number}
                                    onChange={handleCardNumber}
                                    placeholder="0000 0000 0000 0000"
                                    inputMode="numeric"
                                    maxLength={19}
                                    className="w-full border border-border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:font-sans placeholder:text-muted-foreground/40 focus:border-gold/40 focus:outline-none"
                                />
                                {errors.card_number && <p className="mt-1 text-xs text-destructive">{errors.card_number}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="text"
                                        value={data.card_expiry}
                                        onChange={handleExpiry}
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        inputMode="numeric"
                                        className="w-full border border-border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:font-sans placeholder:text-muted-foreground/40 focus:border-gold/40 focus:outline-none"
                                    />
                                    {errors.card_expiry && <p className="mt-1 text-xs text-destructive">{errors.card_expiry}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                                        CVV
                                    </label>
                                    <input
                                        type="password"
                                        value={data.card_cvv}
                                        onChange={(e) => setData('card_cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="•••"
                                        maxLength={4}
                                        inputMode="numeric"
                                        className="w-full border border-border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:font-sans placeholder:text-muted-foreground/40 focus:border-gold/40 focus:outline-none"
                                    />
                                    {errors.card_cvv && <p className="mt-1 text-xs text-destructive">{errors.card_cvv}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-2 flex h-12 w-full items-center justify-center gap-2 bg-gold text-[10px] font-medium tracking-[0.2em] text-accent-foreground uppercase transition-all duration-300 hover:bg-gold-dark disabled:opacity-50"
                            >
                                <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                                {processing ? 'Processing...' : `Pay Now — ${formatCurrency(subtotal)}`}
                            </button>

                            <div className="flex items-center justify-center gap-2 pt-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={1.5} />
                                <p className="text-[10px] text-muted-foreground/50">
                                    256-bit SSL encryption · PCI DSS compliant
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Order summary */}
                    <div className="h-fit lg:sticky lg:top-24">
                        <div className="border border-border bg-card p-6">
                            <h2 className="mb-5 font-serif text-lg font-light text-foreground">
                                Order Summary
                            </h2>

                            <div className="mb-5 space-y-3">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            {item.product.brand && (
                                                <p className="text-[8px] tracking-[0.2em] text-gold uppercase">
                                                    {item.product.brand}
                                                </p>
                                            )}
                                            <p className="font-serif text-xs text-foreground line-clamp-1">
                                                {item.product.name}
                                            </p>
                                            {item.variant.attribute_summary && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    {item.variant.attribute_summary}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground">
                                                Qty {item.quantity}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-sm font-medium text-foreground">
                                            {formatCurrency(Number(item.variant.price ?? 0) * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 border-t border-border pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="text-xs tracking-wider text-gold">Complimentary</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Insurance</span>
                                    <span className="text-xs tracking-wider text-gold">Included</span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-3">
                                    <span className="font-medium text-foreground">Total</span>
                                    <span className="font-serif text-lg text-foreground">{formatCurrency(subtotal)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 space-y-2 border border-border p-4">
                            {[
                                'Expert authentication on every piece',
                                'Insured worldwide delivery',
                                'Secure payment processing',
                                '14-day return policy',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2">
                                    <div className="h-1 w-1 shrink-0 rounded-full bg-gold/60" />
                                    <span className="text-[10px] text-muted-foreground/70">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 text-center">
                            <Link
                                href={catalog()}
                                className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-gold"
                            >
                                ← Back to shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

CheckoutPage.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
