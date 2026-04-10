import { Head, Link, router } from '@inertiajs/react';
import { Minus, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as CartController from '@/actions/App/Http/Controllers/Portal/CartController';
import { Button } from '@/components/ui/button';
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

function formatPrice(price: string | null, qty = 1): string {
    if (!price) { return '—'; }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(price) * qty);
}

export default function PortalCart({ cartItems: initialItems }: Props) {
    const [items, setItems] = useState(initialItems);

    const subtotal = items.reduce((sum, item) => sum + (Number(item.variant.price ?? 0) * item.quantity), 0);

    function updateQuantity(item: CartItemData, delta: number) {
        const newQty = Math.max(1, Math.min(10, item.quantity + delta));
        if (newQty === item.quantity) { return; }

        router.patch(CartController.update.url({ cartItem: item.id }), { quantity: newQty }, {
            preserveScroll: true,
            onSuccess: () => {
                setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: newQty } : i));
            },
        });
    }

    function removeItem(itemId: number) {
        router.delete(CartController.destroy.url({ cartItem: itemId }), {
            preserveScroll: true,
            onSuccess: () => setItems((prev) => prev.filter((i) => i.id !== itemId)),
        });
    }

    return (
        <>
            <Head title="Cart — The Reserved Collection" />

            <div className="container mx-auto px-6 py-10 max-w-5xl">
                <div className="mb-10">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-gold font-light mb-2">Your Order</p>
                    <h1 className="font-serif text-3xl font-light text-foreground">Shopping Cart</h1>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-24 border border-border">
                        <ShoppingBag className="w-14 h-14 text-muted-foreground/15 mx-auto mb-4" strokeWidth={1} />
                        <h2 className="font-serif text-lg font-light text-foreground mb-2">Your cart is empty</h2>
                        <p className="text-[11px] text-muted-foreground mb-6">
                            Add pieces from our collection to begin your order.
                        </p>
                        <Button asChild variant="outline" className="text-[10px] tracking-[0.2em] uppercase rounded-none h-10 px-8">
                            <Link href={catalog()}>Browse Collection</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Item list */}
                        <div className="lg:col-span-2 space-y-px">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-4 bg-card border border-border">
                                    {/* Image */}
                                    <Link href={`/products/${item.product.slug}`} className="shrink-0 w-20 h-20 bg-secondary overflow-hidden">
                                        {item.product.image_url ? (
                                            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-6 h-6 text-muted-foreground/20" strokeWidth={1} />
                                            </div>
                                        )}
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        {item.product.brand && (
                                            <p className="text-[9px] text-gold tracking-[0.2em] uppercase mb-1">{item.product.brand}</p>
                                        )}
                                        <Link href={`/products/${item.product.slug}`}>
                                            <h3 className="font-serif text-sm text-foreground hover:text-gold transition-colors line-clamp-1">{item.product.name}</h3>
                                        </Link>
                                        {item.variant.attribute_summary && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.variant.attribute_summary}</p>
                                        )}

                                        <div className="flex items-center gap-4 mt-3">
                                            {/* Qty controls */}
                                            <div className="flex items-center border border-border">
                                                <button
                                                    onClick={() => updateQuantity(item, -1)}
                                                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                                                    disabled={item.quantity <= 1}
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="w-3 h-3" strokeWidth={1.5} />
                                                </button>
                                                <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item, 1)}
                                                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                                                    disabled={item.quantity >= 10}
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="w-3 h-3" strokeWidth={1.5} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-muted-foreground/50 hover:text-destructive transition-colors"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right shrink-0">
                                        <p className="font-medium text-sm text-foreground">{formatPrice(item.variant.price, item.quantity)}</p>
                                        {item.quantity > 1 && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatPrice(item.variant.price)} ea.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:sticky lg:top-24 h-fit">
                            <div className="bg-card border border-border p-6">
                                <h2 className="font-serif text-lg font-light text-foreground mb-6">Order Summary</h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                        <span className="text-foreground">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="text-gold text-xs tracking-wider">Complimentary</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Insurance</span>
                                        <span className="text-gold text-xs tracking-wider">Included</span>
                                    </div>
                                    <div className="border-t border-border pt-3 flex justify-between">
                                        <span className="font-medium text-foreground">Total</span>
                                        <span className="font-serif text-lg text-foreground">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(subtotal)}
                                        </span>
                                    </div>
                                </div>

                                <Button className="w-full bg-gold hover:bg-gold-dark text-primary-foreground text-[10px] tracking-[0.2em] uppercase h-11 rounded-none">
                                    Proceed to Checkout
                                </Button>

                                <Link href={catalog()} className="block text-center mt-4 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-gold transition-colors">
                                    Continue Shopping
                                </Link>
                            </div>

                            <div className="mt-4 border border-border p-4 space-y-2">
                                {['Expert authentication', 'Insured worldwide shipping', 'Secure payment', '14-day return policy'].map((item) => (
                                    <div key={item} className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-gold/60 shrink-0" />
                                        <span className="text-[10px] text-muted-foreground/70">{item}</span>
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
