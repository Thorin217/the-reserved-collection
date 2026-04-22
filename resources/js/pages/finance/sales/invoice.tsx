import { Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { index as salesIndex, show as saleShow } from '@/routes/admin/finance/sales';

type SaleItemData = {
    id: number;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    product_variant?: { sku?: string | null } | null;
};

type SaleData = {
    id: number;
    sale_number: string;
    status: string;
    currency: string;
    sold_at: string | null;
    subtotal: string;
    tax_total: string;
    discount_total: string;
    total: string;
    balance_due: string;
    notes: string | null;
    client?: {
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        address?: string | null;
        document_number?: string | null;
    } | null;
    user?: { name?: string | null } | null;
    warehouse?: { name?: string | null } | null;
    items?: SaleItemData[];
};

type Props = {
    sale: { data: SaleData };
};

export default function FinanceSalesInvoice({ sale: { data: sale } }: Props) {
    return (
        <>
            <Head title={`Invoice ${sale.sale_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 print:p-0">
                <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={saleShow.url(sale.id)}>Back to sale</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href={salesIndex()}>All sales</Link>
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>

                <div className="mx-auto w-full max-w-3xl rounded-lg border bg-background p-8 shadow-sm print:rounded-none print:border-none print:shadow-none">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">INVOICE</h1>
                            <p className="mt-1 text-muted-foreground">{sale.sale_number}</p>
                        </div>
                        <div className="text-right text-sm">
                            {sale.sold_at && (
                                <p>
                                    <span className="text-muted-foreground">Date: </span>
                                    {new Date(sale.sold_at).toLocaleDateString()}
                                </p>
                            )}
                            <p className="mt-1">
                                <span className="text-muted-foreground">Currency: </span>
                                {sale.currency}
                            </p>
                            {sale.warehouse?.name && (
                                <p className="mt-1">
                                    <span className="text-muted-foreground">Location: </span>
                                    {sale.warehouse.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Bill to
                            </p>
                            <p className="font-semibold">{sale.client?.name ?? '—'}</p>
                            {sale.client?.email && (
                                <p className="text-sm text-muted-foreground">{sale.client.email}</p>
                            )}
                            {sale.client?.phone && (
                                <p className="text-sm text-muted-foreground">{sale.client.phone}</p>
                            )}
                            {sale.client?.document_number && (
                                <p className="text-sm text-muted-foreground">
                                    ID: {sale.client.document_number}
                                </p>
                            )}
                            {sale.client?.address && (
                                <p className="mt-1 text-sm text-muted-foreground">{sale.client.address}</p>
                            )}
                        </div>
                        <div className="text-right sm:text-right">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Issued by
                            </p>
                            <p className="font-semibold">{sale.user?.name ?? '—'}</p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Description</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(sale.items ?? []).map((item) => (
                                <TableRow key={item.id} className="hover:bg-transparent">
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
                        <TableFooter className="bg-transparent">
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="text-right text-muted-foreground">
                                    Subtotal
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {formatCurrency(sale.subtotal)}
                                </TableCell>
                            </TableRow>
                            {parseFloat(sale.discount_total) > 0 && (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={4} className="text-right text-muted-foreground">
                                        Discount
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-destructive">
                                        -{formatCurrency(sale.discount_total)}
                                    </TableCell>
                                </TableRow>
                            )}
                            {parseFloat(sale.tax_total) > 0 && (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={4} className="text-right text-muted-foreground">
                                        Tax
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(sale.tax_total)}
                                    </TableCell>
                                </TableRow>
                            )}
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="text-right font-bold">
                                    Total
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-lg">
                                    {formatCurrency(sale.total)}
                                </TableCell>
                            </TableRow>
                            {parseFloat(sale.balance_due) > 0 && (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={4} className="text-right text-muted-foreground">
                                        Balance due
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-semibold text-destructive">
                                        {formatCurrency(sale.balance_due)}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableFooter>
                    </Table>

                    {sale.notes && (
                        <>
                            <Separator className="my-6" />
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Notes
                                </p>
                                <p className="text-sm text-muted-foreground">{sale.notes}</p>
                            </div>
                        </>
                    )}

                    <Separator className="my-6" />

                    <p className="text-center text-xs text-muted-foreground">
                        Thank you for your business.
                    </p>
                </div>
            </div>
        </>
    );
}

FinanceSalesInvoice.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Sales', href: salesIndex() },
            { title: 'Invoice', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
