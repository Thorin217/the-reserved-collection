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
import {
    cancel as cancelPurchase,
    confirm as confirmPurchase,
    edit as editPurchase,
    index as purchasesIndex,
} from '@/routes/admin/finance/purchases';

type PurchaseItemData = {
    id: number;
    description: string;
    quantity: string;
    unit_cost: string;
    line_total: string;
    product_variant?: { sku?: string | null } | null;
};

type PaymentData = {
    id: number;
    amount: string;
    payment_method: string;
    paid_at: string;
    notes: string | null;
};

type PayableData = {
    id: number;
    status: string;
    amount: string;
    paid_amount: string;
    balance_due: string;
    due_date: string | null;
    payments?: PaymentData[];
};

type PurchaseData = {
    id: number;
    purchase_number: string;
    status: 'draft' | 'confirmed' | 'cancelled';
    currency: string;
    purchased_at: string | null;
    reference: string | null;
    subtotal: string;
    tax_total: string;
    discount_total: string;
    total: string;
    balance_due: string;
    notes: string | null;
    vendor_name: string;
    vendor?: { name?: string | null } | null;
    warehouse?: { name?: string | null } | null;
    user?: { name?: string | null } | null;
    items?: PurchaseItemData[];
    payable?: PayableData | null;
};

type Props = {
    purchase: { data: PurchaseData };
};

const STATUS_CONFIG: Record<
    PurchaseData['status'],
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
    draft: { label: 'Draft', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const PAYMENT_STATUS_CONFIG: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
    pending: { label: 'Pending', variant: 'secondary' },
    partial: { label: 'Partial', variant: 'outline' },
    paid: { label: 'Paid', variant: 'default' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function FinancePurchasesShow({ purchase: { data: purchase } }: Props) {
    const status = STATUS_CONFIG[purchase.status] ?? STATUS_CONFIG.draft;
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const { errors } = usePage<{ errors?: Record<string, string> }>().props;

    const isDraft = purchase.status === 'draft';
    const isConfirmed = purchase.status === 'confirmed';

    return (
        <>
            <Head title={`Purchase ${purchase.purchase_number}`} />
            <FlashMessage />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {errors?.purchase && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        {errors.purchase}
                    </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">{purchase.purchase_number}</h1>
                        <p className="text-sm text-muted-foreground">
                            Purchase details, items, and payable information.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDraft && (
                            <Button asChild variant="outline">
                                <Link href={editPurchase.url(purchase.id)}>Edit purchase</Link>
                            </Button>
                        )}
                        {isDraft && (
                            <Button onClick={() => setConfirmOpen(true)}>Confirm purchase</Button>
                        )}
                        {isDraft && (
                            <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                                Cancel purchase
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link href={purchasesIndex()}>Back to purchases</Link>
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
                            <CardTitle className="text-sm">Vendor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">{purchase.vendor_name}</p>
                            {purchase.reference && (
                                <p className="text-xs text-muted-foreground">
                                    Ref: {purchase.reference}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Warehouse</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">
                                {purchase.warehouse?.name ?? 'Not assigned'}
                            </p>
                            {!purchase.warehouse?.name && (
                                <p className="text-xs text-muted-foreground">
                                    Assign a warehouse before confirming.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">{formatCurrency(purchase.total)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Balance due</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">
                                {formatCurrency(purchase.balance_due)}
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
                                    <TableHead className="text-right">Unit cost</TableHead>
                                    <TableHead className="text-right">Line total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(purchase.items ?? []).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.product_variant?.sku ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(item.unit_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(item.line_total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(purchase.items ?? []).length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-6 text-center text-muted-foreground"
                                        >
                                            No items added yet.
                                        </TableCell>
                                    </TableRow>
                                )}
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
                            <p className="font-semibold">{formatCurrency(purchase.subtotal)}</p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-muted-foreground">Tax</p>
                            <p className="font-semibold">{formatCurrency(purchase.tax_total)}</p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-muted-foreground">Discount</p>
                            <p className="font-semibold">{formatCurrency(purchase.discount_total)}</p>
                        </div>
                        <div className="rounded-md border p-3">
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-semibold">{formatCurrency(purchase.total)}</p>
                        </div>
                    </CardContent>
                </Card>

                {isConfirmed && purchase.payable && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Account payable</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 grid gap-2 text-sm md:grid-cols-4">
                                <div className="rounded-md border p-3">
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge
                                        variant={
                                            PAYMENT_STATUS_CONFIG[purchase.payable.status]
                                                ?.variant ?? 'secondary'
                                        }
                                    >
                                        {PAYMENT_STATUS_CONFIG[purchase.payable.status]?.label ??
                                            purchase.payable.status}
                                    </Badge>
                                </div>
                                <div className="rounded-md border p-3">
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-semibold">
                                        {formatCurrency(purchase.payable.amount)}
                                    </p>
                                </div>
                                <div className="rounded-md border p-3">
                                    <p className="text-muted-foreground">Paid</p>
                                    <p className="font-semibold">
                                        {formatCurrency(purchase.payable.paid_amount)}
                                    </p>
                                </div>
                                <div className="rounded-md border p-3">
                                    <p className="text-muted-foreground">Balance due</p>
                                    <p className="font-semibold">
                                        {formatCurrency(purchase.payable.balance_due)}
                                    </p>
                                </div>
                            </div>

                            {(purchase.payable.payments ?? []).length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead>Date</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Notes</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchase.payable.payments!.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(payment.paid_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {payment.payment_method.replace('_', ' ')}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {payment.notes ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(payment.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            <ConfirmationModal
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Confirm purchase"
                description={`You are about to confirm ${purchase.purchase_number}. This will update inventory stock and generate an account payable.`}
                confirmLabel="Confirm purchase"
                onConfirm={() => {
                    router.post(confirmPurchase.url(purchase.id));
                    setConfirmOpen(false);
                }}
            />

            <ConfirmationModal
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                title="Cancel purchase"
                description={`You are about to cancel ${purchase.purchase_number}. This action cannot be undone.`}
                confirmLabel="Cancel purchase"
                confirmVariant="destructive"
                onConfirm={() => {
                    router.post(cancelPurchase.url(purchase.id));
                    setCancelOpen(false);
                }}
            />
        </>
    );
}

FinancePurchasesShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Purchases', href: purchasesIndex() },
            { title: 'Details', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
