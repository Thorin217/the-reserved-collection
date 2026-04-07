import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type Transfer = {
    id: number;
    code: string;
    status: string;
    from_warehouse?: { name?: string };
    to_warehouse?: { name?: string };
    created_at: string;
};

type Props = {
    transfers: { data: Transfer[]; meta: { total: number } };
};

export default function InventoryTransfersIndex({ transfers }: Props) {
    return (
        <>
            <Head title="Inventory Transfers" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Transfers</h1>
                    <p className="text-sm text-muted-foreground">{transfers.meta.total} transfer records</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transfers.data.map((transfer) => (
                                    <TableRow key={transfer.id}>
                                        <TableCell className="font-mono text-xs">{transfer.code}</TableCell>
                                        <TableCell>{transfer.from_warehouse?.name ?? '—'}</TableCell>
                                        <TableCell>{transfer.to_warehouse?.name ?? '—'}</TableCell>
                                        <TableCell><Badge variant="outline">{transfer.status}</Badge></TableCell>
                                        <TableCell>{new Date(transfer.created_at).toLocaleString()}</TableCell>
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

InventoryTransfersIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventory', href: '#' }, { title: 'Transfers', href: '/admin/inventory/transfers' }]}>
        {page}
    </AppLayout>
);
