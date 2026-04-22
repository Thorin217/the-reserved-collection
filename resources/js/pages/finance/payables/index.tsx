import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import {
    create as createPayable,
    index as payablesIndex,
    show as payableShow,
} from '@/routes/admin/finance/payables';
import type { PaginatedData } from '@/types';

const ALL = '_all';

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'outline' | 'destructive';
    }
> = {
    pending: { label: 'Pending', variant: 'secondary' },
    partial: { label: 'Partial', variant: 'outline' },
    paid: { label: 'Paid', variant: 'default' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

type PayableRow = {
    id: number;
    vendor_name: string;
    reference: string | null;
    status: string;
    due_date: string | null;
    amount: string;
    paid_amount: string;
    balance_due: string;
    sale?: { sale_number?: string | null } | null;
    user?: { name?: string | null } | null;
};

type Props = {
    payables: PaginatedData<PayableRow>;
    metrics: {
        pending_count: number;
        partial_count: number;
        overdue_count: number;
        balance_total: number;
    };
    filters: {
        filter?: {
            search?: string;
            status?: string;
        };
        page?: string;
    };
};

export default function FinancePayablesIndex({
    payables,
    metrics,
    filters,
}: Props) {
    const active = filters.filter ?? {};
    const [search, setSearch] = useState(active.search ?? '');

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;

        router.get(
            payablesIndex(),
            { filter: { ...active, [key]: resolved } },
            { preserveState: true, replace: true },
        );
    }

    function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        applyFilter('search', search);
    }

    return (
        <>
            <Head title="Accounts Payable" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Accounts Payable</h1>
                        <p className="text-sm text-muted-foreground">
                            Vendor obligations and outgoing payment control.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={createPayable()}>
                            <Plus className="mr-2 h-4 w-4" />
                            New payable
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {metrics.pending_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Partial</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {metrics.partial_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Overdue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {metrics.overdue_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Outstanding
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {formatCurrency(metrics.balance_total)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by vendor or reference..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-72"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>

                    <Select
                        value={active.status ?? ALL}
                        onValueChange={(value) => applyFilter('status', value)}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(
                                ([value, { label }]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Related sale</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due date</TableHead>
                                    <TableHead className="text-right">
                                        Amount
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Paid
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Balance
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payables.data.map((payable) => {
                                    const status =
                                        STATUS_CONFIG[payable.status] ??
                                        STATUS_CONFIG.pending;

                                    return (
                                        <TableRow
                                            key={payable.id}
                                            className="cursor-pointer"
                                            onClick={() => router.visit(payableShow.url(payable.id))}
                                        >
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={payableShow.url(payable.id)}
                                                    className="hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {payable.vendor_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {payable.reference ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {payable.sale?.sale_number ??
                                                    '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {payable.due_date
                                                    ? new Date(
                                                          payable.due_date,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(payable.amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(
                                                    payable.paid_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(
                                                    payable.balance_due,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {payables.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No payables registered yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {payables.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={payables.meta.current_page}
                        lastPage={payables.meta.last_page}
                        onPageChange={(page) =>
                            router.get(
                                payablesIndex(),
                                { filter: active, page: String(page) },
                                { preserveState: true, replace: true },
                            )
                        }
                    />
                )}
            </div>
        </>
    );
}

FinancePayablesIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Payables', href: payablesIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
