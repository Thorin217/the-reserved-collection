import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    variants: { data: Array<{ id: number; sku: string; product?: { name?: string; has_serial_numbers?: boolean } }> };
    filters: {
        movement_type?: string;
        warehouse_id?: string;
        branch_id?: string;
        reference_type?: string;
        reference_id?: string;
        search?: string;
    };
};

export default function InventoryMovementsIndex({ movements, branches, warehouses, variants, filters }: Props) {
    const [openingModalOpen, setOpeningModalOpen] = useState(false);

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
        })),
        [variants.data],
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

                        <Select
                            value={movementTypeFilter}
                            onValueChange={(value) => applyFilters({ ...filters, movement_type: value === '_all' ? '' : value })}
                        >
                            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All types</SelectItem>
                                <SelectItem value="opening">Opening</SelectItem>
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

            <Dialog open={openingModalOpen} onOpenChange={setOpeningModalOpen}>
                <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Register stock opening</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submitStockOpening} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Warehouse</Label>
                                <Select
                                    value={openingForm.data.warehouse_id}
                                    onValueChange={(value) => openingForm.setData('warehouse_id', value)}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={openingForm.errors.warehouse_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>Variant</Label>
                                <Select
                                    value={openingForm.data.product_variant_id}
                                    onValueChange={(value) => openingForm.setData('product_variant_id', value)}
                                >
                                    <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Select variant" /></SelectTrigger>
                                    <SelectContent>
                                        {variantOptions.map((variant) => (
                                            <SelectItem key={variant.value} value={variant.value} className="max-w-full truncate">
                                                {variant.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
