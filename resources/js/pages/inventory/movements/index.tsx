import { Head, router, useForm } from '@inertiajs/react';
import { Eye, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import TablePagination from '@/components/table-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index as movementsIndex, opening as movementsOpening } from '@/routes/admin/inventory/movements';
import type { PaginatedData } from '@/types';

type Movement = {
    id: number;
    movement_type: string;
    reference_type: string | null;
    reference_id: number | null;
    quantity: string | null;
    unit_cost: string | null;
    balance_after_movement: string | null;
    notes: string | null;
    warehouse?: { name?: string };
    branch?: { name?: string };
    product_variant?: { sku?: string; product?: { name?: string } };
    serial?: { serial_number?: string };
    user?: { name?: string };
    created_at: string;
};

type Props = {
    movements: PaginatedData<Movement>;
    branches: { data: Array<{ id: number; name: string }> };
    warehouses: { data: Array<{ id: number; name: string }> };
    variants: { data: Array<{ id: number; sku: string; product?: { name?: string; has_serial_numbers?: boolean } }> };
    filters: {
        movement_type?: string;
        warehouse_id?: string;
        branch_id?: string;
        reference_type?: string;
        reference_id?: string;
        search?: string;
        page?: string;
    };
};

export default function InventoryMovementsIndex({ movements, branches, warehouses, variants, filters }: Props) {
    const [openingModalOpen, setOpeningModalOpen] = useState(false);
    const [viewingMovement, setViewingMovement] = useState<Movement | null>(null);

    const movementTypeFilter = filters.movement_type ?? '_all';
    const warehouseFilter = filters.warehouse_id ?? '_all';
    const branchFilter = filters.branch_id ?? '_all';
    const hasTraceFilter = Boolean(filters.reference_type && filters.reference_id);

    const openingForm = useForm({
        warehouse_id: '',
        product_variant_id: '',
        quantity: '1',
        unit_cost: '',
        notes: '',
        serial_numbers_text: '',
    });

    const variantOptions = useMemo(
        () => variants.data.map((variant) => ({
            value: variant.id.toString(),
            label: `${variant.sku} · ${variant.product?.name ?? 'Product'}`,
            hasSerialNumbers: Boolean(variant.product?.has_serial_numbers),
            keywords: `${variant.sku} ${variant.product?.name ?? ''}`,
        })),
        [variants.data],
    );

    const movementTypeOptions = useMemo(
        () => [
            { value: '_all', label: 'All types' },
            { value: 'opening', label: 'Opening' },
            { value: 'purchase', label: 'Purchase' },
            { value: 'sale', label: 'Sale' },
            { value: 'transfer_out', label: 'Transfer out' },
            { value: 'transfer_in', label: 'Transfer in' },
            { value: 'adjustment_in', label: 'Adjustment in' },
            { value: 'adjustment_out', label: 'Adjustment out' },
            { value: 'reservation', label: 'Reservation' },
            { value: 'reservation_release', label: 'Reservation release' },
        ],
        [],
    );

    const branchOptions = useMemo(
        () => [
            { value: '_all', label: 'All branches' },
            ...branches.data.map((branch) => ({
                value: branch.id.toString(),
                label: branch.name,
                keywords: branch.name,
            })),
        ],
        [branches.data],
    );

    const warehouseOptions = useMemo(
        () => [
            { value: '_all', label: 'All warehouses' },
            ...warehouses.data.map((warehouse) => ({
                value: warehouse.id.toString(),
                label: warehouse.name,
                keywords: warehouse.name,
            })),
        ],
        [warehouses.data],
    );

    const openingWarehouseOptions = useMemo(
        () => warehouses.data.map((warehouse) => ({
            value: warehouse.id.toString(),
            label: warehouse.name,
            keywords: warehouse.name,
        })),
        [warehouses.data],
    );

    const selectedVariant = variantOptions.find((variant) => variant.value === openingForm.data.product_variant_id) ?? null;
    const requiresSerialNumbers = Boolean(selectedVariant?.hasSerialNumbers);

    const parsedSerialNumbers = useMemo(
        () => openingForm.data.serial_numbers_text
            .split(/\r?\n|,|;/)
            .map((serial) => serial.trim())
            .filter((serial) => serial.length > 0),
        [openingForm.data.serial_numbers_text],
    );

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

    function openStockOpeningModal() {
        openingForm.reset();
        setOpeningModalOpen(true);
    }

    function submitStockOpening(e: React.FormEvent) {
        e.preventDefault();

        openingForm.transform((data) => ({
            warehouse_id: data.warehouse_id,
            product_variant_id: data.product_variant_id,
            quantity: data.quantity,
            unit_cost: data.unit_cost || null,
            notes: data.notes || null,
            serial_numbers: parsedSerialNumbers,
        }));

        openingForm.post(movementsOpening.url(), {
            preserveScroll: true,
            onSuccess: () => {
                openingForm.reset();
                setOpeningModalOpen(false);
            },
        });
    }

    function formatMovementType(value: string): string {
        return value
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    function formatReferenceType(value: string | null): string {
        if (!value) {
            return '—';
        }

        const parts = value.split('\\');
        const shortName = parts[parts.length - 1] ?? value;

        return shortName;
    }

    return (
        <>
            <Head title="Inventory Movements" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">Inventory Movements</h1>
                            <p className="text-sm text-muted-foreground">
                                {movements.meta.total} movement records
                            </p>
                        </div>

                        <Button size="sm" onClick={openStockOpeningModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Stock opening
                        </Button>
                    </div>
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

                        <SearchableSelect
                            value={movementTypeFilter}
                            onValueChange={(value) => applyFilters({ ...filters, movement_type: value === '_all' ? '' : value })}
                            options={movementTypeOptions}
                            placeholder="Type"
                            searchPlaceholder="Search movement type"
                        />

                        <SearchableSelect
                            value={branchFilter}
                            onValueChange={(value) => applyFilters({ ...filters, branch_id: value === '_all' ? '' : value })}
                            options={branchOptions}
                            placeholder="Branch"
                            searchPlaceholder="Search branch"
                        />

                        <SearchableSelect
                            value={warehouseFilter}
                            onValueChange={(value) => applyFilters({ ...filters, warehouse_id: value === '_all' ? '' : value })}
                            options={warehouseOptions}
                            placeholder="Warehouse"
                            searchPlaceholder="Search warehouse"
                        />
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
                                    <TableHead className="text-right">Actions</TableHead>
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
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewingMovement(movement)}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {movements.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={movements.meta.current_page}
                        lastPage={movements.meta.last_page}
                        onPageChange={(page) => applyFilters({ ...filters, page: String(page) })}
                    />
                )}
            </div>

            <Dialog open={openingModalOpen} onOpenChange={setOpeningModalOpen}>
                <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Register stock opening</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submitStockOpening} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Warehouse</Label>
                                <SearchableSelect
                                    value={openingForm.data.warehouse_id}
                                    onValueChange={(value) => openingForm.setData('warehouse_id', value)}
                                    options={openingWarehouseOptions}
                                    placeholder="Select warehouse"
                                    searchPlaceholder="Search warehouse"
                                />
                                <InputError message={openingForm.errors.warehouse_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>Variant</Label>
                                <SearchableSelect
                                    value={openingForm.data.product_variant_id}
                                    onValueChange={(value) => openingForm.setData('product_variant_id', value)}
                                    options={variantOptions}
                                    placeholder="Select variant"
                                    searchPlaceholder="Search variant or product"
                                />
                                <InputError message={openingForm.errors.product_variant_id} />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={openingForm.data.quantity}
                                    onChange={(e) => openingForm.setData('quantity', e.target.value)}
                                />
                                <InputError message={openingForm.errors.quantity} />
                            </div>

                            <div className="space-y-2">
                                <Label>Unit cost (optional)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={openingForm.data.unit_cost}
                                    onChange={(e) => openingForm.setData('unit_cost', e.target.value)}
                                />
                                <InputError message={openingForm.errors.unit_cost} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                value={openingForm.data.notes}
                                onChange={(e) => openingForm.setData('notes', e.target.value)}
                                placeholder="Initial stock import"
                            />
                            <InputError message={openingForm.errors.notes} />
                        </div>

                        {requiresSerialNumbers && (
                            <div className="space-y-2 rounded-md border p-3">
                                <Label>Serial numbers</Label>
                                <Textarea
                                    value={openingForm.data.serial_numbers_text}
                                    onChange={(e) => openingForm.setData('serial_numbers_text', e.target.value)}
                                    placeholder="One per line, or separated by comma"
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Parsed serials: {parsedSerialNumbers.length}. For serialized variants, this count must match quantity.
                                </p>
                                <InputError
                                    message={openingForm.errors.serial_numbers_text || (openingForm.errors as Record<string, string>).serial_numbers}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpeningModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={openingForm.processing}>
                                {openingForm.processing ? 'Saving...' : 'Register opening'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(viewingMovement)} onOpenChange={(open) => !open && setViewingMovement(null)}>
                <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Movement detail</DialogTitle>
                    </DialogHeader>

                    {viewingMovement && (
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <Card>
                                    <CardContent className="space-y-2 p-4 text-sm">
                                        <p><span className="text-muted-foreground">Type:</span> {formatMovementType(viewingMovement.movement_type)}</p>
                                        <p><span className="text-muted-foreground">Quantity:</span> {viewingMovement.quantity ?? '0.00'}</p>
                                        <p><span className="text-muted-foreground">Unit cost:</span> {viewingMovement.unit_cost ?? '—'}</p>
                                        <p><span className="text-muted-foreground">Balance after movement:</span> {viewingMovement.balance_after_movement ?? '—'}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="space-y-2 p-4 text-sm">
                                        <p><span className="text-muted-foreground">SKU:</span> {viewingMovement.product_variant?.sku ?? '—'}</p>
                                        <p><span className="text-muted-foreground">Product:</span> {viewingMovement.product_variant?.product?.name ?? '—'}</p>
                                        <p><span className="text-muted-foreground">Serial:</span> {viewingMovement.serial?.serial_number ?? '—'}</p>
                                        <p><span className="text-muted-foreground">User:</span> {viewingMovement.user?.name ?? '—'}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardContent className="space-y-2 p-4 text-sm">
                                    <p>
                                        <span className="text-muted-foreground">Reference:</span>{' '}
                                        {viewingMovement.reference_id
                                            ? `${formatReferenceType(viewingMovement.reference_type)} #${viewingMovement.reference_id}`
                                            : '—'}
                                    </p>
                                    <p><span className="text-muted-foreground">Branch:</span> {viewingMovement.branch?.name ?? '—'}</p>
                                    <p><span className="text-muted-foreground">Warehouse:</span> {viewingMovement.warehouse?.name ?? '—'}</p>
                                    <p><span className="text-muted-foreground">Date:</span> {new Date(viewingMovement.created_at).toLocaleString()}</p>
                                    <div>
                                        <p className="text-muted-foreground">Notes</p>
                                        <p className="mt-1 rounded-md border bg-muted/30 p-3 text-sm">
                                            {viewingMovement.notes ?? '—'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
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
