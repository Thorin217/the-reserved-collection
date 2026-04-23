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
    create as createPurchase,
    index as purchasesIndex,
    show as purchaseShow,
} from '@/routes/admin/finance/purchases';
import type { PaginatedData } from '@/types';

const ALL = '_all';

const STATUS_CONFIG: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
    draft: { label: 'Draft', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

type PurchaseRow = {
    id: number;
    purchase_number: string;
    vendor_name: string;
    reference: string | null;
    status: string;
    purchased_at: string | null;
    total: string;
    balance_due: string;
    warehouse?: { name?: string | null } | null;
};

type Props = {
    purchases: PaginatedData<PurchaseRow>;
    metrics: {
        draft_count: number;
        confirmed_count: number;
        total_value: number;
        pending_balance: number;
    };
    filters: {
        filter?: { search?: string; status?: string };
        page?: string;
    };
};

export default function FinancePurchasesIndex({ purchases, metrics, filters }: Props) {
    const active = filters.filter ?? {};
    const [search, setSearch] = useState(active.search ?? '');

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(
            purchasesIndex(),
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
            <Head title="Purchases" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Purchases</h1>
                        <p className="text-sm text-muted-foreground">
                            Purchase orders from vendors and inventory receiving.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={createPurchase()}>
                            <Plus className="mr-2 h-4 w-4" />
                            New purchase
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Draft</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{metrics.draft_count}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Confirmed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{metrics.confirmed_count}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Purchases total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{formatCurrency(metrics.total_value)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Pending balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{formatCurrency(metrics.pending_balance)}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by PO number, vendor or reference..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-80"
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
                            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
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
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead>Purchased at</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Balance due</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.data.map((purchase) => {
                                    const status =
                                        STATUS_CONFIG[purchase.status] ?? STATUS_CONFIG.draft;

                                    return (
                                        <TableRow
                                            key={purchase.id}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                router.visit(purchaseShow.url(purchase.id))
                                            }
                                        >
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={purchaseShow.url(purchase.id)}
                                                    className="hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {purchase.purchase_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{purchase.vendor_name}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {purchase.reference ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {purchase.warehouse?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {purchase.purchased_at
                                                    ? new Date(
                                                          purchase.purchased_at,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(purchase.total)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(purchase.balance_due)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {purchases.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No purchases registered yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {purchases.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={purchases.meta.current_page}
                        lastPage={purchases.meta.last_page}
                        onPageChange={(page) =>
                            router.get(
                                purchasesIndex(),
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

FinancePurchasesIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Purchases', href: purchasesIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
