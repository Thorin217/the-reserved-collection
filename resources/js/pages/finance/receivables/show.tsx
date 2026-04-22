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
import { index as receivablesIndex, show as receivableShow } from '@/routes/admin/finance/receivables';
import { store as storePayment } from '@/routes/admin/finance/receivables/payments';
import { show as saleShow } from '@/routes/admin/finance/sales';

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

type Payment = {
    id: number;
    amount: string;
    payment_method: string;
    payment_date: string;
    reference: string | null;
    notes: string | null;
    created_at: string;
};

type Receivable = {
    id: number;
    reference: string | null;
    status: string;
    due_date: string | null;
    amount: string;
    paid_amount: string;
    balance_due: string;
    paid_at: string | null;
    notes: string | null;
    client?: { name?: string | null; email?: string | null } | null;
    sale?: { id?: number | null; sale_number?: string | null } | null;
    payments?: Payment[];
};

type PaymentMethodOption = { value: string; label: string };

type Props = {
    receivable: { data: Receivable };
    payment_methods: PaymentMethodOption[];
};

const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
    check: 'Check',
    other: 'Other',
};

export default function FinanceReceivablesShow({
    receivable: { data: receivable },
    payment_methods,
}: Props) {
    const statusConfig = STATUS_CONFIG[receivable.status] ?? STATUS_CONFIG.pending;
    const isSettled = receivable.status === 'paid' || receivable.status === 'cancelled';

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_method: '',
        payment_date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(storePayment.url(receivable.id), {
            onSuccess: () => reset(),
        });
    }

    return (
        <>
            <Head title={`Receivable ${receivable.reference ?? receivable.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {receivable.reference ?? `Receivable #${receivable.id}`}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Payment history and balance tracking.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={receivablesIndex()}>Back to receivables</Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={statusConfig.variant}>
                                {statusConfig.label}
                            </Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Client</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">
                                {receivable.client?.name ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {receivable.client?.email ?? ''}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">
                                {formatCurrency(receivable.amount)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Balance due</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-semibold">
                                {formatCurrency(receivable.balance_due)}
                            </p>
                            {receivable.due_date && (
                                <p className="text-xs text-muted-foreground">
                                    Due {new Date(receivable.due_date).toLocaleDateString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {receivable.sale?.id && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Linked sale:</span>
                        <Link
                            href={saleShow.url(receivable.sale.id)}
                            className="font-medium underline underline-offset-2"
                        >
                            {receivable.sale.sale_number}
                        </Link>
                    </div>
                )}

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
                                {(receivable.payments ?? []).map((payment) => (
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
                                {(receivable.payments ?? []).length === 0 && (
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
                                            (max {formatCurrency(receivable.balance_due)})
                                        </span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={receivable.balance_due}
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
                                        placeholder="Optional notes about this payment..."
                                        rows={2}
                                    />
                                    {errors.notes && (
                                        <p className="text-xs text-destructive">{errors.notes}</p>
                                    )}
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

FinanceReceivablesShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Receivables', href: receivablesIndex() },
            { title: 'Detail', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
