import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type Reservation = {
    id: number;
    status: string;
    quantity: string;
    expires_at: string | null;
    warehouse?: { name?: string };
    product_variant?: { sku?: string; product?: { name?: string } };
    created_at: string;
};

type Props = {
    reservations: { data: Reservation[]; meta: { total: number } };
};

export default function InventoryReservationsIndex({ reservations }: Props) {
    return (
        <>
            <Head title="Inventory Reservations" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Reservations</h1>
                    <p className="text-sm text-muted-foreground">{reservations.meta.total} reservation records</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Expires</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reservations.data.map((reservation) => (
                                    <TableRow key={reservation.id}>
                                        <TableCell>{reservation.product_variant?.product?.name ?? '—'}</TableCell>
                                        <TableCell className="font-mono text-xs">{reservation.product_variant?.sku ?? '—'}</TableCell>
                                        <TableCell>{reservation.warehouse?.name ?? '—'}</TableCell>
                                        <TableCell className="text-right">{reservation.quantity}</TableCell>
                                        <TableCell><Badge variant="outline">{reservation.status}</Badge></TableCell>
                                        <TableCell>{reservation.expires_at ? new Date(reservation.expires_at).toLocaleString() : '—'}</TableCell>
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

InventoryReservationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventory', href: '#' }, { title: 'Reservations', href: '/admin/inventory/reservations' }]}>
        {page}
    </AppLayout>
);
