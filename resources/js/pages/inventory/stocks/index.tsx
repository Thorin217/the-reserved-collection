import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

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
    stocks: { data: Stock[]; meta: { total: number } };
};

export default function InventoryStocksIndex({ stocks }: Props) {
    return (
        <>
            <Head title="Inventory Stocks" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Stocks</h1>
                    <p className="text-sm text-muted-foreground">{stocks.meta.total} stock records</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Variant SKU</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Reserved</TableHead>
                                    <TableHead className="text-right">Available</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stocks.data.map((stock) => (
                                    <TableRow key={stock.id}>
                                        <TableCell>{stock.product_variant?.product?.name ?? '—'}</TableCell>
                                        <TableCell className="font-mono text-xs">{stock.product_variant?.sku ?? '—'}</TableCell>
                                        <TableCell>{stock.warehouse?.name ?? '—'}</TableCell>
                                        <TableCell className="text-right">{stock.quantity}</TableCell>
                                        <TableCell className="text-right">{stock.reserved_quantity ?? '0.00'}</TableCell>
                                        <TableCell className="text-right">{stock.available_quantity ?? '0.00'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

InventoryStocksIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventory', href: '#' }, { title: 'Stocks', href: '/admin/inventory/stocks' }]}>
        {page}
    </AppLayout>
);
