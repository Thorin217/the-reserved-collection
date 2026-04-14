import { Head, Link, router } from '@inertiajs/react';
import { Minus, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as CartController from '@/actions/App/Http/Controllers/Portal/CartController';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { catalog } from '@/routes/portal';

type CartItemData = {
    id: number;
    quantity: number;
    variant: {
        id: number;
        sku: string;
        price: string | null;
        compare_price: string | null;
        attribute_summary: string | null;
    };
    product: {
        id: number;
        name: string;
        slug: string;
        image_url: string;
        brand: string | null;
    };
};

type Props = {
    cartItems: CartItemData[];
};

function formatPrice(price: string | number | null, qty = 1): string {
    if (price === null || price === undefined || price === '') {
        return '—';
    }

    return formatCurrency(Number(price) * qty);
}

export default function PortalCart({ cartItems: initialItems }: Props) {
    const [items, setItems] = useState(initialItems);

    const subtotal = items.reduce(
        (sum, item) => sum + Number(item.variant.price ?? 0) * item.quantity,
        0,
    );

    function updateQuantity(item: CartItemData, delta: number) {
        const newQty = Math.max(1, Math.min(10, item.quantity + delta));
        if (newQty === item.quantity) {
            return;
        }

        router.patch(
            CartController.update.url({ cartItem: item.id }),
            { quantity: newQty },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setItems((prev) =>
                        prev.map((i) =>
                            i.id === item.id ? { ...i, quantity: newQty } : i,
                        ),
                    );
                },
            },
        );
    }

    function removeItem(itemId: number) {
        router.delete(CartController.destroy.url({ cartItem: itemId }), {
            preserveScroll: true,
            onSuccess: () =>
                setItems((prev) => prev.filter((i) => i.id !== itemId)),
        });
    }

    return (
        <>
            <Head title="Cart — The Reserved Collection" />

            <div className="container mx-auto max-w-5xl px-6 py-10">
                <div className="mb-10">
                    <p className="mb-2 text-[9px] font-light tracking-[0.3em] text-gold uppercase">
                        Your Order
                    </p>
                    <h1 className="font-serif text-3xl font-light text-foreground">
                        Shopping Cart
                    </h1>
                </div>

                {items.length === 0 ? (
                    <div className="border border-border py-24 text-center">
                        <ShoppingBag
                            className="mx-auto mb-4 h-14 w-14 text-muted-foreground/15"
                            strokeWidth={1}
                        />
                        <h2 className="mb-2 font-serif text-lg font-light text-foreground">
                            Your cart is empty
                        </h2>
                        <p className="mb-6 text-[11px] text-muted-foreground">
                            Add pieces from our collection to begin your order.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="h-10 rounded-none px-8 text-[10px] tracking-[0.2em] uppercase"
                        >
                            <Link href={catalog()}>Browse Collection</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Item list */}
                        <div className="space-y-px lg:col-span-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 border border-border bg-card p-4"
                                >
                                    {/* Image */}
                                    <Link
                                        href={`/products/${item.product.slug}`}
                                        className="h-20 w-20 shrink-0 overflow-hidden bg-secondary"
                                    >
                                        {item.product.image_url ? (
                                            <img
                                                src={item.product.image_url}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Package
                                                    className="h-6 w-6 text-muted-foreground/20"
                                                    strokeWidth={1}
                                                />
                                            </div>
                                        )}
                                    </Link>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        {item.product.brand && (
                                            <p className="mb-1 text-[9px] tracking-[0.2em] text-gold uppercase">
                                                {item.product.brand}
                                            </p>
                                        )}
                                        <Link
                                            href={`/products/${item.product.slug}`}
                                        >
                                            <h3 className="line-clamp-1 font-serif text-sm text-foreground transition-colors hover:text-gold">
                                                {item.product.name}
                                            </h3>
                                        </Link>
                                        {item.variant.attribute_summary && (
                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                {item.variant.attribute_summary}
                                            </p>
                                        )}

                                        <div className="mt-3 flex items-center gap-4">
                                            {/* Qty controls */}
                                            <div className="flex items-center border border-border">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(item, -1)
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                                                    disabled={
                                                        item.quantity <= 1
                                                    }
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus
                                                        className="h-3 w-3"
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                                <span className="w-8 text-center text-xs font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(item, 1)
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                                                    disabled={
                                                        item.quantity >= 10
                                                    }
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus
                                                        className="h-3 w-3"
                                                        strokeWidth={1.5}
                                                    />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    removeItem(item.id)
                                                }
                                                className="text-muted-foreground/50 transition-colors hover:text-destructive"
                                                aria-label="Remove item"
                                            >
                                                <Trash2
                                                    className="h-3.5 w-3.5"
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-medium text-foreground">
                                            {formatPrice(
                                                item.variant.price,
                                                item.quantity,
                                            )}
                                        </p>
                                        {item.quantity > 1 && (
                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                {formatPrice(
                                                    item.variant.price,
                                                )}{' '}
                                                ea.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="h-fit lg:sticky lg:top-24">
                            <div className="border border-border bg-card p-6">
                                <h2 className="mb-6 font-serif text-lg font-light text-foreground">
                                    Order Summary
                                </h2>

                                <div className="mb-6 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Subtotal (
                                            {items.reduce(
                                                (s, i) => s + i.quantity,
                                                0,
                                            )}{' '}
                                            items)
                                        </span>
                                        <span className="text-foreground">
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Shipping
                                        </span>
                                        <span className="text-xs tracking-wider text-gold">
                                            Complimentary
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Insurance
                                        </span>
                                        <span className="text-xs tracking-wider text-gold">
                                            Included
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-border pt-3">
                                        <span className="font-medium text-foreground">
                                            Total
                                        </span>
                                        <span className="font-serif text-lg text-foreground">
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>
                                </div>

                                <Button className="h-11 w-full rounded-none bg-gold text-[10px] tracking-[0.2em] text-primary-foreground uppercase hover:bg-gold-dark">
                                    Proceed to Checkout
                                </Button>

                                <Link
                                    href={catalog()}
                                    className="mt-4 block text-center text-[10px] tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-gold"
                                >
                                    Continue Shopping
                                </Link>
                            </div>

                            <div className="mt-4 space-y-2 border border-border p-4">
                                {[
                                    'Expert authentication',
                                    'Insured worldwide shipping',
                                    'Secure payment',
                                    '14-day return policy',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="h-1 w-1 shrink-0 rounded-full bg-gold/60" />
                                        <span className="text-[10px] text-muted-foreground/70">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

PortalCart.layout = (page: React.ReactNode) => (
    <PortalLayout>{page}</PortalLayout>
);
