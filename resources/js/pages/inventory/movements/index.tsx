import { Head, Link, router } from '@inertiajs/react';
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
import { index as movementsIndex } from '@/routes/admin/inventory/movements';
import type { PaginatedData } from '@/types';

type Movement = {
    id: number;
    movement_type: string;
    reference_type: string | null;
    reference_id: number | null;
    quantity: string | null;
    notes: string | null;
    warehouse?: { name?: string };
    branch?: { name?: string };
    product_variant?: { sku?: string };
    serial?: { serial_number?: string };
    created_at: string;
};

type Props = {
    movements: PaginatedData<Movement>;
    branches: { data: Array<{ id: number; name: string }> };
    warehouses: { data: Array<{ id: number; name: string }> };
    filters: {
        movement_type?: string;
        warehouse_id?: string;
        branch_id?: string;
        reference_type?: string;
        reference_id?: string;
        search?: string;
    };
};

export default function InventoryMovementsIndex({ movements, branches, warehouses, filters }: Props) {
    const movementTypeFilter = filters.movement_type ?? '_all';
    const warehouseFilter = filters.warehouse_id ?? '_all';
    const branchFilter = filters.branch_id ?? '_all';
    const hasTraceFilter = Boolean(filters.reference_type && filters.reference_id);

    function applyFilters(payload: Props['filters']) {
        router.get(movementsIndex.url(), payload, { preserveState: true, replace: true });
    }

    function clearTraceFilter() {
        applyFilters({
            ...filters,
            reference_type: '',
            reference_id: '',
        });
    }

    return (
        <>
            <Head title="Inventory Movements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Movements</h1>
                    <p className="text-sm text-muted-foreground">
                        {movements.meta.total} movement records
                    </p>
                </div>

                {hasTraceFilter && (
                    <Card>
                        <CardContent className="flex items-center justify-between gap-3 p-4">
                            <p className="text-sm text-muted-foreground">
                                Showing trace for reference #{filters.reference_id}
                            </p>
                            <button className="text-sm text-primary underline" onClick={clearTraceFilter}>
                                Clear trace filter
                            </button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-4">
                        <Input
                            placeholder="Search by SKU, serial, reference"
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
                            value={movementTypeFilter}
                            onValueChange={(value) => applyFilters({ ...filters, movement_type: value === '_all' ? '' : value })}
                        >
                            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All types</SelectItem>
                                <SelectItem value="purchase">Purchase</SelectItem>
                                <SelectItem value="sale">Sale</SelectItem>
                                <SelectItem value="transfer_out">Transfer out</SelectItem>
                                <SelectItem value="transfer_in">Transfer in</SelectItem>
                                <SelectItem value="adjustment_in">Adjustment in</SelectItem>
                                <SelectItem value="adjustment_out">Adjustment out</SelectItem>
                                <SelectItem value="reservation">Reservation</SelectItem>
                                <SelectItem value="reservation_release">Reservation release</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={branchFilter}
                            onValueChange={(value) => applyFilters({ ...filters, branch_id: value === '_all' ? '' : value })}
                        >
                            <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All branches</SelectItem>
                                {branches.data.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

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
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Serial</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.data.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell>
                                            {movement.movement_type}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {movement.reference_type && movement.reference_id
                                                ? `#${movement.reference_id}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {movement.product_variant?.sku ??
                                                '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {movement.serial?.serial_number ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {movement.branch?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {movement.warehouse?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {movement.quantity ?? '0.00'}
                                        </TableCell>
                                        <TableCell className="max-w-70 truncate text-xs text-muted-foreground">
                                            {movement.notes ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                movement.created_at,
                                            ).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {movements.meta.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {movements.links.prev && <Link href={movements.links.prev} className="text-sm text-primary underline">← Previous</Link>}
                        <span className="text-sm text-muted-foreground">Page {movements.meta.current_page} of {movements.meta.last_page}</span>
                        {movements.links.next && <Link href={movements.links.next} className="text-sm text-primary underline">Next →</Link>}
                    </div>
                )}
            </div>
        </>
    );
}

InventoryMovementsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Movements', href: movementsIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
