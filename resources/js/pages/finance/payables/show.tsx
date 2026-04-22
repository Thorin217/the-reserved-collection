import { Head, Link, useForm } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { index as payablesIndex, show as payableShow } from '@/routes/admin/finance/payables';
import { store as storePayment } from '@/routes/admin/finance/payables/payments';
import { show as vendorShow } from '@/routes/admin/finance/vendors';

const STATUS_CONFIG: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
    pending: { label: 'Pending', variant: 'secondary' },
    partial: { label: 'Partial', variant: 'outline' },
    paid: { label: 'Paid', variant: 'default' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
    check: 'Check',
    other: 'Other',
};

type Payment = {
    id: number;
    amount: string;
    payment_method: string;
    payment_date: string;
    reference: string | null;
};

type Payable = {
    id: number;
    vendor_name: string | null;
    reference: string | null;
    status: string;
    due_date: string | null;
    amount: string;
    paid_amount: string;
    balance_due: string;
    paid_at: string | null;
    notes: string | null;
    vendor?: { id?: number | null; name?: string | null } | null;
    sale?: { id?: number | null; sale_number?: string | null } | null;
    payments?: Payment[];
};

type PaymentMethodOption = { value: string; label: string };

type Props = {
    payable: { data: Payable };
    payment_methods: PaymentMethodOption[];
};

export default function FinancePayablesShow({
    payable: { data: payable },
    payment_methods,
}: Props) {
    const statusConfig = STATUS_CONFIG[payable.status] ?? STATUS_CONFIG.pending;
    const isSettled = payable.status === 'paid' || payable.status === 'cancelled';
    const vendorDisplayName = payable.vendor?.name ?? payable.vendor_name ?? '—';

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_method: '',
        payment_date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(storePayment.url(payable.id), {
            onSuccess: () => reset(),
        });
    }

    return (
        <>
            <Head title={`Payable ${payable.reference ?? payable.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {payable.reference ?? `Payable #${payable.id}`}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Payment history and outgoing balance.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={payablesIndex()}>Back to payables</Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Vendor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {payable.vendor?.id ? (
                                <Link
                                    href={vendorShow.url(payable.vendor.id)}
                                    className="text-sm font-medium hover:underline"
                                >
                                    {vendorDisplayName}
                                </Link>
                            ) : (
                                <p className="text-sm font-medium">{vendorDisplayName}</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">{formatCurrency(payable.amount)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Balance due</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">{formatCurrency(payable.balance_due)}</p>
                            {payable.due_date && (
                                <p className="text-xs text-muted-foreground">
                                    Due {new Date(payable.due_date).toLocaleDateString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment history</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(payable.payments ?? []).map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            {new Date(payment.payment_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {payment.reference ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(payment.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(payable.payments ?? []).length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No payments recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {!isSettled && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Record payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="amount">
                                        Amount
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            (max {formatCurrency(payable.balance_due)})
                                        </span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={payable.balance_due}
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {errors.amount && (
                                        <p className="text-xs text-destructive">{errors.amount}</p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="payment_method">Payment method</Label>
                                    <Select
                                        value={data.payment_method}
                                        onValueChange={(value) => setData('payment_method', value)}
                                    >
                                        <SelectTrigger id="payment_method">
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {payment_methods.map((method) => (
                                                <SelectItem key={method.value} value={method.value}>
                                                    {method.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.payment_method && (
                                        <p className="text-xs text-destructive">{errors.payment_method}</p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="payment_date">Payment date</Label>
                                    <Input
                                        id="payment_date"
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                    />
                                    {errors.payment_date && (
                                        <p className="text-xs text-destructive">{errors.payment_date}</p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input
                                        id="reference"
                                        value={data.reference}
                                        onChange={(e) => setData('reference', e.target.value)}
                                        placeholder="Transfer ID, cheque number, etc."
                                    />
                                    {errors.reference && (
                                        <p className="text-xs text-destructive">{errors.reference}</p>
                                    )}
                                </div>

                                <div className="grid gap-1.5 md:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Optional notes..."
                                        rows={2}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Recording...' : 'Record payment'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

FinancePayablesShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Payables', href: payablesIndex() },
            { title: 'Detail', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
