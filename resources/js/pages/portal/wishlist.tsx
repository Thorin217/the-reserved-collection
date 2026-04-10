import { Head, Link, router } from '@inertiajs/react';
import { Heart, Package } from 'lucide-react';
import { useState } from 'react';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PortalLayout from '@/layouts/portal-layout';
import { catalog } from '@/routes/portal';

type PortalProduct = {
    id: number;
    name: string;
    slug: string;
    brand?: { id: number; name: string; slug: string };
    category?: { id: number; name: string; slug: string };
    price: string | null;
    compare_price: string | null;
    image_url: string;
};

type Props = {
    products: { data: PortalProduct[] };
    wishlistIds: number[];
};

function formatPrice(price: string | null): string {
    if (!price) { return 'Price on request'; }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(price));
}

export default function PortalWishlist({ products, wishlistIds }: Props) {
    const [localItems, setLocalItems] = useState(products.data);

    function removeFromWishlist(productId: number) {
        router.post(WishlistController.toggle.url({ product: productId }), {}, {
            preserveScroll: true,
            onSuccess: () => setLocalItems((prev) => prev.filter((p) => p.id !== productId)),
        });
    }

    return (
        <>
            <Head title="My Wishlist — The Reserved Collection" />

            <div className="container mx-auto px-6 py-10 max-w-5xl">
                <div className="mb-10">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-gold font-light mb-2">Account</p>
                    <div className="flex items-end justify-between">
                        <h1 className="font-serif text-3xl font-light text-foreground">My Wishlist</h1>
                        <span className="text-[11px] text-muted-foreground">
                            {localItems.length} saved piece{localItems.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {localItems.length === 0 ? (
                    <div className="text-center py-24 border border-border">
                        <Heart className="w-14 h-14 text-muted-foreground/15 mx-auto mb-4" strokeWidth={1} />
                        <h2 className="font-serif text-lg font-light text-foreground mb-2">Your wishlist is empty</h2>
                        <p className="text-[11px] text-muted-foreground mb-6">
                            Save pieces you love by tapping the heart icon on any item.
                        </p>
                        <Button asChild variant="outline" className="text-[10px] tracking-[0.2em] uppercase rounded-none h-10 px-8">
                            <Link href={catalog()}>Browse Collection</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {localItems.map((product) => {
                            const discount = product.price && product.compare_price && Number(product.compare_price) > Number(product.price)
                                ? Math.round((1 - Number(product.price) / Number(product.compare_price)) * 100)
                                : null;

                            return (
                                <div key={product.id} className="group bg-card border border-border hover:border-gold/30 transition-all">
                                    <Link href={`/products/${product.slug}`} className="block overflow-hidden aspect-square bg-secondary relative">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-10 h-10 text-muted-foreground/20" strokeWidth={1} />
                                            </div>
                                        )}
                                        {discount && (
                                            <span className="absolute top-3 left-3 bg-gold text-primary-foreground text-[8px] px-2 py-0.5 tracking-wider uppercase">
                                                -{discount}%
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.preventDefault(); removeFromWishlist(product.id); }}
                                            className="absolute top-3 right-3 w-7 h-7 bg-gold border-gold text-primary-foreground border flex items-center justify-center hover:bg-destructive hover:border-destructive transition-all"
                                            aria-label="Remove from wishlist"
                                        >
                                            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} fill="currentColor" />
                                        </button>
                                    </Link>
                                    <div className="p-4">
                                        {product.brand && (
                                            <p className="text-[9px] text-gold font-light tracking-[0.25em] uppercase mb-1">{product.brand.name}</p>
                                        )}
                                        <Link href={`/products/${product.slug}`}>
                                            <h3 className="font-serif text-sm text-foreground leading-snug mb-2 hover:text-gold transition-colors line-clamp-2">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        {product.category && (
                                            <Badge variant="outline" className="text-[8px] tracking-wider uppercase mb-3">{product.category.name}</Badge>
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-medium text-foreground">{formatPrice(product.price)}</span>
                                            {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                                                <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

PortalWishlist.layout = (page: React.ReactNode) => (
    <PortalLayout wishlistCount={0}>{page}</PortalLayout>
);
