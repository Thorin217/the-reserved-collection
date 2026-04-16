import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { index as ordersIndex } from '@/routes/portal/orders';

type OrderItem = {
    id: number;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    product_variant?: {
        sku?: string | null;
    } | null;
};

type OrderData = {
    id: number;
    sale_number: string;
    status: 'draft' | 'confirmed' | 'cancelled';
    subtotal: string;
    tax_total: string;
    discount_total: string;
    total: string;
    balance_due: string;
    created_at: string;
    notes: string | null;
    items?: OrderItem[];
};

type Props = {
    order: {
        data: OrderData;
    };
};

const STATUS_LABELS: Record<OrderData['status'], string> = {
    draft: 'Pending review',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
};

export default function PortalOrderShow({ order: { data: order } }: Props) {
    return (
        <>
            <Head title={`${order.sale_number} — The Reserved Collection`} />

            <div className="container mx-auto max-w-5xl px-6 py-10">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="mb-2 text-[9px] font-light tracking-[0.3em] text-gold uppercase">
                            Order
                        </p>
                        <h1 className="font-serif text-3xl font-light text-foreground">
                            {order.sale_number}
                        </h1>
                        <p className="text-[11px] text-muted-foreground">
                            {STATUS_LABELS[order.status]} · {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-none">
                        <Link href={ordersIndex()}>Back to orders</Link>
                    </Button>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="space-y-px lg:col-span-2">
                        {(order.items ?? []).map((item) => (
                            <div
                                key={item.id}
                                className="border border-border bg-card px-5 py-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {item.description}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            SKU: {item.product_variant?.sku ?? '—'}
                                        </p>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="text-muted-foreground">Qty {item.quantity}</p>
                                        <p className="font-medium text-foreground">
                                            {formatCurrency(item.line_total)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-fit border border-border bg-card p-6">
                        <h2 className="mb-4 font-serif text-lg font-light text-foreground">
                            Summary
                        </h2>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span>{formatCurrency(order.tax_total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount</span>
                                <span>{formatCurrency(order.discount_total)}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-3 font-semibold">
                                <span>Total</span>
                                <span>{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Balance due</span>
                                <span>{formatCurrency(order.balance_due)}</span>
                            </div>
                        </div>

                        {order.notes && (
                            <div className="mt-5 border-t border-border pt-4">
                                <p className="text-[11px] text-muted-foreground">
                                    {order.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

PortalOrderShow.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
