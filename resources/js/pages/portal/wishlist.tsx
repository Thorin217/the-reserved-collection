import { Head, Link, router } from '@inertiajs/react';
import { Heart, Package } from 'lucide-react';
import { useState } from 'react';
import * as WishlistController from '@/actions/App/Http/Controllers/Portal/WishlistController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
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
    if (!price) {
        return 'Price on request';
    }

    return formatCurrency(price);
}

export default function PortalWishlist({ products, wishlistIds }: Props) {
    const [localItems, setLocalItems] = useState(products.data);

    function removeFromWishlist(productId: number) {
        router.post(
            WishlistController.toggle.url({ product: productId }),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    setLocalItems((prev) =>
                        prev.filter((p) => p.id !== productId),
                    ),
            },
        );
    }

    return (
        <>
            <Head title="My Wishlist — The Reserved Collection" />

            <div className="container mx-auto max-w-5xl px-6 py-10">
                <div className="mb-10">
                    <p className="mb-2 text-[9px] font-light tracking-[0.3em] text-gold uppercase">
                        Account
                    </p>
                    <div className="flex items-end justify-between">
                        <h1 className="font-serif text-3xl font-light text-foreground">
                            My Wishlist
                        </h1>
                        <span className="text-[11px] text-muted-foreground">
                            {localItems.length} saved piece
                            {localItems.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {localItems.length === 0 ? (
                    <div className="border border-border py-24 text-center">
                        <Heart
                            className="mx-auto mb-4 h-14 w-14 text-muted-foreground/15"
                            strokeWidth={1}
                        />
                        <h2 className="mb-2 font-serif text-lg font-light text-foreground">
                            Your wishlist is empty
                        </h2>
                        <p className="mb-6 text-[11px] text-muted-foreground">
                            Save pieces you love by tapping the heart icon on
                            any item.
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
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {localItems.map((product) => {
                            const discount =
                                product.price &&
                                product.compare_price &&
                                Number(product.compare_price) >
                                    Number(product.price)
                                    ? Math.round(
                                          (1 -
                                              Number(product.price) /
                                                  Number(
                                                      product.compare_price,
                                                  )) *
                                              100,
                                      )
                                    : null;

                            return (
                                <div
                                    key={product.id}
                                    className="group border border-border bg-card transition-all hover:border-gold/30"
                                >
                                    <Link
                                        href={`/products/${product.slug}`}
                                        className="relative block aspect-square overflow-hidden bg-secondary"
                                    >
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Package
                                                    className="h-10 w-10 text-muted-foreground/20"
                                                    strokeWidth={1}
                                                />
                                            </div>
                                        )}
                                        {discount && (
                                            <span className="absolute top-3 left-3 bg-gold px-2 py-0.5 text-[8px] tracking-wider text-primary-foreground uppercase">
                                                -{discount}%
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                removeFromWishlist(product.id);
                                            }}
                                            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center border border-gold bg-gold text-primary-foreground transition-all hover:border-destructive hover:bg-destructive"
                                            aria-label="Remove from wishlist"
                                        >
                                            <Heart
                                                className="h-3.5 w-3.5"
                                                strokeWidth={1.5}
                                                fill="currentColor"
                                            />
                                        </button>
                                    </Link>
                                    <div className="p-4">
                                        {product.brand && (
                                            <p className="mb-1 text-[9px] font-light tracking-[0.25em] text-gold uppercase">
                                                {product.brand.name}
                                            </p>
                                        )}
                                        <Link
                                            href={`/products/${product.slug}`}
                                        >
                                            <h3 className="mb-2 line-clamp-2 font-serif text-sm leading-snug text-foreground transition-colors hover:text-gold">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        {product.category && (
                                            <Badge
                                                variant="outline"
                                                className="mb-3 text-[8px] tracking-wider uppercase"
                                            >
                                                {product.category.name}
                                            </Badge>
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-medium text-foreground">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.compare_price &&
                                                Number(product.compare_price) >
                                                    Number(product.price) && (
                                                    <span className="text-[10px] text-muted-foreground line-through">
                                                        {formatPrice(
                                                            product.compare_price,
                                                        )}
                                                    </span>
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
