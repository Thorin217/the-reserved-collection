import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
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
import { index as salesIndex } from '@/routes/admin/finance/sales';
import type { PaginatedData } from '@/types';

const ALL = '_all';

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'outline' | 'destructive';
    }
> = {
    draft: { label: 'Draft', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

type SaleRow = {
    id: number;
    sale_number: string;
    status: string;
    total: string;
    balance_due: string;
    sold_at: string | null;
    client?: { name?: string | null } | null;
    warehouse?: { name?: string | null } | null;
    user?: { name?: string | null } | null;
};

type Filters = {
    filter?: {
        search?: string;
        status?: string;
        user_id?: string;
    };
    page?: string;
};

type Props = {
    sales: PaginatedData<SaleRow>;
    users: { data: Array<{ id: number; name: string }> };
    metrics: {
        draft_count: number;
        confirmed_count: number;
        total_value: number;
        pending_balance: number;
    };
    filters: Filters;
};

export default function FinanceSalesIndex({
    sales,
    users,
    metrics,
    filters,
}: Props) {
    const active = filters.filter ?? {};
    const [search, setSearch] = useState(active.search ?? '');

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;

        router.get(
            salesIndex(),
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
            <Head title="Sales" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div>
                    <h1 className="text-2xl font-bold">Sales</h1>
                    <p className="text-sm text-muted-foreground">
                        Manual sales confirmations and outstanding balances.
                    </p>
                </div>

                <div className="flex justify-end">
                    <Button asChild>
                        <Link href="/admin/finance/sales/create">New sale</Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Draft</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {metrics.draft_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Confirmed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {metrics.confirmed_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Sales total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {formatCurrency(metrics.total_value)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Pending balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {formatCurrency(metrics.pending_balance)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by sale or client..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-64"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>

                    <Select
                        value={active.status ?? ALL}
                        onValueChange={(value) => applyFilter('status', value)}
                    >
                        <SelectTrigger className="w-40">
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

                    <Select
                        value={active.user_id ?? ALL}
                        onValueChange={(value) => applyFilter('user_id', value)}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Created by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All users</SelectItem>
                            {users.data.map((user) => (
                                <SelectItem
                                    key={user.id}
                                    value={String(user.id)}
                                >
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Sale</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead>Sold at</TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Balance due
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.data.map((sale) => {
                                    const status =
                                        STATUS_CONFIG[sale.status] ??
                                        STATUS_CONFIG.draft;

                                    return (
                                        <TableRow key={sale.id}>
                                            <TableCell className="font-medium">
                                                {sale.sale_number}
                                            </TableCell>
                                            <TableCell>
                                                {sale.client?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {sale.warehouse?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {sale.sold_at
                                                    ? new Date(
                                                          sale.sold_at,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(sale.total)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(
                                                    sale.balance_due,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Link href={`/admin/finance/sales/${sale.id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {sales.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No sales registered yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {sales.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={sales.meta.current_page}
                        lastPage={sales.meta.last_page}
                        onPageChange={(page) =>
                            router.get(
                                salesIndex(),
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

FinanceSalesIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Sales', href: salesIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
