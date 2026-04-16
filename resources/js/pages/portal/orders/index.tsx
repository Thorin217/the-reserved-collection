import { Head, Link } from '@inertiajs/react';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { catalog } from '@/routes/portal';
import { show as orderShow } from '@/routes/portal/orders';

type OrderData = {
    id: number;
    sale_number: string;
    status: 'draft' | 'confirmed' | 'cancelled';
    total: string;
    balance_due: string;
    created_at: string;
    items?: Array<{
        id: number;
        description: string;
        quantity: string;
    }>;
};

type Props = {
    orders: {
        data: OrderData[];
    };
};

const STATUS_LABELS: Record<OrderData['status'], string> = {
    draft: 'Pending review',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
};

export default function PortalOrdersIndex({ orders }: Props) {
    return (
        <>
            <Head title="My Orders — The Reserved Collection" />

            <div className="container mx-auto max-w-5xl px-6 py-10">
                <div className="mb-8 flex items-center justify-between gap-3">
                    <div>
                        <p className="mb-2 text-[9px] font-light tracking-[0.3em] text-gold uppercase">
                            Account
                        </p>
                        <h1 className="font-serif text-3xl font-light text-foreground">
                            My Orders
                        </h1>
                    </div>
                    <Button asChild variant="outline" className="rounded-none">
                        <Link href={catalog()}>Continue shopping</Link>
                    </Button>
                </div>

                {orders.data.length === 0 ? (
                    <div className="border border-border py-24 text-center">
                        <ShoppingBag
                            className="mx-auto mb-4 h-14 w-14 text-muted-foreground/15"
                            strokeWidth={1}
                        />
                        <h2 className="mb-2 font-serif text-lg font-light text-foreground">
                            You have no orders yet
                        </h2>
                        <p className="mb-6 text-[11px] text-muted-foreground">
                            Add items to your cart and complete checkout to place your first order.
                        </p>
                        <Button asChild className="rounded-none">
                            <Link href={catalog()}>Browse collection</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.data.map((order) => (
                            <Link
                                key={order.id}
                                href={orderShow(order.id)}
                                className="block border border-border bg-card p-5 transition-colors hover:border-gold/40"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="font-serif text-lg text-foreground">
                                            {order.sale_number}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {STATUS_LABELS[order.status]} · {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Total</p>
                                        <p className="font-serif text-lg text-foreground">
                                            {formatCurrency(order.total)}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Balance due</p>
                                        <p className="font-medium text-foreground">
                                            {formatCurrency(order.balance_due)}
                                        </p>
                                    </div>

                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

PortalOrdersIndex.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
