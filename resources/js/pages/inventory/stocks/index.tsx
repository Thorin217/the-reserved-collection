import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { subscribeInventoryStockChanges } from '@/lib/inventory-stock-sync';
import { index as stocksIndex } from '@/routes/admin/inventory/stocks';
import type { PaginatedData } from '@/types';

type Stock = {
    id: number;
    quantity: string;
    available_quantity: string | null;
    reserved_quantity: string | null;
    average_cost: string | null;
    warehouse?: { name?: string };
    product_variant?: { sku?: string; product?: { name?: string } };
};

type Props = {
    stocks: PaginatedData<Stock>;
    warehouses: { data: Array<{ id: number; name: string }> };
    filters: {
        warehouse_id?: string;
        search?: string;
    };
};

export default function InventoryStocksIndex({ stocks, warehouses, filters }: Props) {
    const warehouseFilter = filters.warehouse_id ?? '_all';

    useEffect(() => {
        const reloadStocks = () => {
            router.reload({
                only: ['stocks'],
            });
        };

        const interval = window.setInterval(reloadStocks, 8000);
        const unsubscribe = subscribeInventoryStockChanges(reloadStocks);

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                reloadStocks();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.clearInterval(interval);
            unsubscribe();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    function applyFilters(payload: Props['filters']) {
        router.get(stocksIndex.url(), payload, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Inventory Stocks" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Stocks</h1>
                    <p className="text-sm text-muted-foreground">
                        {stocks.meta.total} stock records
                    </p>
                </div>

                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                        <Input
                            placeholder="Search by product or SKU"
                            defaultValue={filters.search ?? ''}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    applyFilters({
                                        ...filters,
                                        search: (e.currentTarget as HTMLInputElement).value,
                                    });
                                }
                            }}
                        />

                        <Select
                            value={warehouseFilter}
                            onValueChange={(value) => applyFilters({ ...filters, warehouse_id: value === '_all' ? '' : value })}
                        >
                            <SelectTrigger><SelectValue placeholder="Warehouse" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All warehouses</SelectItem>
                                {warehouses.data.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Variant SKU</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Reserved
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Available
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stocks.data.map((stock) => (
                                    <TableRow key={stock.id}>
                                        <TableCell>
                                            {stock.product_variant?.product
                                                ?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {stock.product_variant?.sku ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {stock.warehouse?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {stock.quantity}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {stock.reserved_quantity ?? '0.00'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {stock.available_quantity ?? '0.00'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {stocks.meta.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {stocks.links.prev && <Link href={stocks.links.prev} className="text-sm text-primary underline">← Previous</Link>}
                        <span className="text-sm text-muted-foreground">Page {stocks.meta.current_page} of {stocks.meta.last_page}</span>
                        {stocks.links.next && <Link href={stocks.links.next} className="text-sm text-primary underline">Next →</Link>}
                    </div>
                )}
            </div>
        </>
    );
}

InventoryStocksIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Stocks', href: stocksIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
