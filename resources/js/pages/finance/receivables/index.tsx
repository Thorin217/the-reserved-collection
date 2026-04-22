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
    create as createReceivable,
    index as receivablesIndex,
    show as receivableShow,
} from '@/routes/admin/finance/receivables';
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

type ReceivableRow = {
    id: number;
    reference: string | null;
    status: string;
    due_date: string | null;
    amount: string;
    paid_amount: string;
    balance_due: string;
    client?: { name?: string | null } | null;
    sale?: { sale_number?: string | null } | null;
};

type Props = {
    receivables: PaginatedData<ReceivableRow>;
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

export default function FinanceReceivablesIndex({
    receivables,
    metrics,
    filters,
}: Props) {
    const active = filters.filter ?? {};
    const [search, setSearch] = useState(active.search ?? '');

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;

        router.get(
            receivablesIndex(),
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
            <Head title="Accounts Receivable" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Accounts Receivable</h1>
                        <p className="text-sm text-muted-foreground">
                            Open balances and collection follow-up.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={createReceivable()}>
                            <Plus className="mr-2 h-4 w-4" />
                            New receivable
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
                            placeholder="Search by reference or client..."
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
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Sale</TableHead>
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
                                {receivables.data.map((receivable) => {
                                    const status =
                                        STATUS_CONFIG[receivable.status] ??
                                        STATUS_CONFIG.pending;

                                    return (
                                        <TableRow
                                            key={receivable.id}
                                            className="cursor-pointer"
                                            onClick={() => router.visit(receivableShow.url(receivable.id))}
                                        >
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={receivableShow.url(receivable.id)}
                                                    className="hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {receivable.reference ?? `#${receivable.id}`}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {receivable.client?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {receivable.sale?.sale_number ??
                                                    '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {receivable.due_date
                                                    ? new Date(
                                                          receivable.due_date,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(
                                                    receivable.amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(
                                                    receivable.paid_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(
                                                    receivable.balance_due,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {receivables.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No receivables registered yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {receivables.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={receivables.meta.current_page}
                        lastPage={receivables.meta.last_page}
                        onPageChange={(page) =>
                            router.get(
                                receivablesIndex(),
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

FinanceReceivablesIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Receivables', href: receivablesIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
