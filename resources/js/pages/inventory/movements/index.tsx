import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type Movement = {
    id: number;
    movement_type: string;
    quantity: string | null;
    warehouse?: { name?: string };
    branch?: { name?: string };
    product_variant?: { sku?: string };
    created_at: string;
};

type Props = {
    movements: { data: Movement[]; meta: { total: number } };
};

export default function InventoryMovementsIndex({ movements }: Props) {
    return (
        <>
            <Head title="Inventory Movements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Movements</h1>
                    <p className="text-sm text-muted-foreground">{movements.meta.total} movement records</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.data.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell>{movement.movement_type}</TableCell>
                                        <TableCell className="font-mono text-xs">{movement.product_variant?.sku ?? '—'}</TableCell>
                                        <TableCell>{movement.branch?.name ?? '—'}</TableCell>
                                        <TableCell>{movement.warehouse?.name ?? '—'}</TableCell>
                                        <TableCell className="text-right">{movement.quantity ?? '0.00'}</TableCell>
                                        <TableCell>{new Date(movement.created_at).toLocaleString()}</TableCell>
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

InventoryMovementsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventory', href: '#' }, { title: 'Movements', href: '/admin/inventory/movements' }]}>
        {page}
    </AppLayout>
);
