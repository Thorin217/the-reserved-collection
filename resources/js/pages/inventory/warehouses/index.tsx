import { Head, Link, router } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { PaginatedData } from '@/types';

type Warehouse = {
    id: number;
    name: string;
    type: string;
    allows_sales: boolean;
    is_active: boolean;
    branch?: { id: number; name: string };
    inventory_stocks_count?: number;
};

type Props = {
    warehouses: PaginatedData<Warehouse>;
};

export default function WarehousesIndex({ warehouses }: Props) {
    function deleteWarehouse(warehouse: Warehouse) {
        if (!confirm(`Delete warehouse "${warehouse.name}"?`)) {
            return;
        }

        router.delete(`/admin/warehouses/${warehouse.id}`);
    }

    return (
        <>
            <Head title="Warehouses" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Warehouses</h1>
                        <p className="text-sm text-muted-foreground">{warehouses.meta.total} warehouses registered</p>
                    </div>
                    <Button asChild size="sm">
                        <Link href="/admin/warehouses/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New warehouse
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Sales</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {warehouses.data.map((warehouse) => (
                                    <TableRow key={warehouse.id}>
                                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                                        <TableCell>{warehouse.branch?.name ?? '—'}</TableCell>
                                        <TableCell className="capitalize">{warehouse.type.replace('_', ' ')}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={warehouse.allows_sales ? 'default' : 'secondary'}>
                                                {warehouse.allows_sales ? 'Allowed' : 'Blocked'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                                                {warehouse.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/admin/warehouses/${warehouse.id}/edit`}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => deleteWarehouse(warehouse)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {warehouses.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                            No warehouses registered.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

WarehousesIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Configuration', href: '#' }, { title: 'Warehouses', href: '/admin/warehouses' }]}>
        {page}
    </AppLayout>
);
