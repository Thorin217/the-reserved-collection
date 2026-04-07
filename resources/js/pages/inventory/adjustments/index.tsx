import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type Adjustment = {
    id: number;
    code: string;
    adjustment_type: string;
    status: string;
    warehouse?: { name?: string };
    created_at: string;
};

type Props = {
    adjustments: { data: Adjustment[]; meta: { total: number } };
};

export default function InventoryAdjustmentsIndex({ adjustments }: Props) {
    return (
        <>
            <Head title="Inventory Adjustments" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Adjustments</h1>
                    <p className="text-sm text-muted-foreground">{adjustments.meta.total} adjustment records</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adjustments.data.map((adjustment) => (
                                    <TableRow key={adjustment.id}>
                                        <TableCell className="font-mono text-xs">{adjustment.code}</TableCell>
                                        <TableCell>{adjustment.warehouse?.name ?? '—'}</TableCell>
                                        <TableCell>{adjustment.adjustment_type}</TableCell>
                                        <TableCell><Badge variant="outline">{adjustment.status}</Badge></TableCell>
                                        <TableCell>{new Date(adjustment.created_at).toLocaleString()}</TableCell>
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

InventoryAdjustmentsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventory', href: '#' }, { title: 'Adjustments', href: '/admin/inventory/adjustments' }]}>
        {page}
    </AppLayout>
);
