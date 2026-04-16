import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { index as salesIndex } from '@/routes/admin/finance/sales';

type SaleItemData = {
    id: number;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    product_variant?: {
        sku?: string | null;
    } | null;
};

type SaleData = {
    id: number;
    sale_number: string;
    status: 'draft' | 'confirmed' | 'cancelled';
    currency: 'USD';
    sold_at: string | null;
    subtotal: string;
    tax_total: string;
    discount_total: string;
    total: string;
    balance_due: string;
    notes: string | null;
    client?: { name?: string | null; email?: string | null } | null;
    user?: { name?: string | null } | null;
    warehouse?: { name?: string | null } | null;
    items?: SaleItemData[];
};

type Props = {
    sale: { data: SaleData };
    can: {
        update?: boolean;
        confirm: boolean;
        cancel: boolean;
    };
};

const STATUS_CONFIG: Record<
    SaleData['status'],
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
    draft: { label: 'Draft', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function FinanceSalesShow({ sale: { data: sale }, can }: Props) {
    const status = STATUS_CONFIG[sale.status] ?? STATUS_CONFIG.draft;
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const { errors } = usePage<{ errors?: Record<string, string> }>().props;

    return (
        <>
            <Head title={`Sale ${sale.sale_number}`} />
            <FlashMessage />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {errors?.sale && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        {errors.sale}
                    </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">{sale.sale_number}</h1>
                        <p className="text-sm text-muted-foreground">
                            Sale details, items, and settlement information.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {can.update && sale.status !== 'confirmed' && (
                            <Button asChild variant="outline">
                                <Link href={`/admin/finance/sales/${sale.id}/edit`}>
                                    Edit sale
                                </Link>
                            </Button>
                        )}
                        {can.confirm && (
                            <Button
                                onClick={() => setConfirmOpen(true)}
                            >
                                Confirm sale
                            </Button>
                        )}
                        {can.cancel && (
                            <Button
                                variant="destructive"
                                onClick={() => setCancelOpen(true)}
                            >
                                Cancel sale
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link href={salesIndex()}>Back to sales</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={status.variant}>{status.label}</Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Client</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">
                                {sale.client?.name ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {sale.client?.email ?? ''}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Warehouse</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">
                                {sale.warehouse?.name ?? 'Not assigned'}
                            </p>
                            {!sale.warehouse?.name && (
                                <p className="text-xs text-muted-foreground">
                                    Assign a warehouse before confirming this sale.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">
                                {formatCurrency(sale.total)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Balance due
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">
                                {formatCurrency(sale.balance_due)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Description</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Unit</TableHead>
                                    <TableHead className="text-right">Line</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(sale.items ?? []).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.product_variant?.sku ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(item.unit_price)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(item.line_total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-md border p-3">
                            <p className="text-muted-foreground">Subtotal</p>
                            <p className="font-semibold">
                                {formatCurrency(sale.subtotal)}
                            </p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-muted-foreground">Tax</p>
                            <p className="font-semibold">
                                {formatCurrency(sale.tax_total)}
                            </p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-muted-foreground">Discount</p>
                            <p className="font-semibold">
                                {formatCurrency(sale.discount_total)}
                            </p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-semibold">
                                {formatCurrency(sale.total)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ConfirmationModal
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Mark sale as sold"
                description={`You are about to confirm ${sale.sale_number}. This will validate stock and lock draft edition.`}
                confirmLabel="Confirm sale"
                onConfirm={() => {
                    router.post(`/admin/finance/sales/${sale.id}/confirm`);
                    setConfirmOpen(false);
                }}
            />

            <ConfirmationModal
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                title="Cancel sale"
                description={`You are about to cancel ${sale.sale_number}. This action will mark the sale as cancelled.`}
                confirmLabel="Cancel sale"
                confirmVariant="destructive"
                onConfirm={() => {
                    router.post(`/admin/finance/sales/${sale.id}/cancel`);
                    setCancelOpen(false);
                }}
            />
        </>
    );
}

FinanceSalesShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Sales', href: salesIndex() },
            { title: 'Details', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
