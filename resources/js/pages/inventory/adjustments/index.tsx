import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { notifyInventoryStockChanged } from '@/lib/inventory-stock-sync';
import {
    cancel,
    confirm as confirmAdjustment,
    destroy,
    index as adjustmentsIndex,
    store,
    update,
} from '@/routes/admin/inventory/adjustments';
import { index as movementsIndex } from '@/routes/admin/inventory/movements';
import type { PaginatedData } from '@/types';

type Adjustment = {
    id: number;
    code: string;
    adjustment_type: string;
    status: string;
    notes: string | null;
    reason: string | null;
    warehouse_id: number;
    items?: Array<{
        id: number;
        product_variant_id: number;
        quantity: string;
        unit_cost: string | null;
    }>;
    warehouse?: { name?: string };
    created_at: string;
};

type Warehouse = {
    id: number;
    name: string;
};

type Variant = {
    id: number;
    sku: string;
    product?: { name?: string };
};

type AdjustmentForm = {
    warehouse_id: string;
    adjustment_type: string;
    reason: string;
    notes: string;
    items: Array<{
        product_variant_id: string;
        quantity: string;
        unit_cost: string;
    }>;
};

type Filters = {
    status?: string;
    adjustment_type?: string;
    warehouse_id?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    page?: number;
};

type Props = {
    adjustments: PaginatedData<Adjustment>;
    warehouses: { data: Warehouse[] };
    variants: { data: Variant[] };
    serial_candidates: Record<string, Array<{ id: number; serial_number: string }>>;
    adjustment_serials: Record<string, Record<string, Array<{ id: number; serial_number: string | null; status: string | null }>>>;
    filters: Filters;
};

export default function InventoryAdjustmentsIndex({
    adjustments,
    warehouses,
    variants,
    serial_candidates: serialCandidates,
    adjustment_serials: adjustmentSerials,
    filters,
}: Props) {
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Adjustment | null>(null);
    const [viewingItems, setViewingItems] = useState<Adjustment | null>(null);
    const [confirming, setConfirming] = useState<Adjustment | null>(null);
    const [pendingAction, setPendingAction] = useState<{
        action: 'confirm' | 'cancel' | 'delete';
        adjustment: Adjustment;
    } | null>(null);
    const [selectedSerialsByItem, setSelectedSerialsByItem] = useState<
        Record<string, string[]>
    >({});

    const statusFilter = filters.status ?? '_all';
    const adjustmentTypeFilter = filters.adjustment_type ?? '_all';
    const warehouseFilter = filters.warehouse_id ?? '_all';
    const sortBy = filters.sort_by ?? 'created_at';
    const sortDir = filters.sort_dir ?? 'desc';

    const createForm = useForm<AdjustmentForm>({
        warehouse_id: '',
        adjustment_type: 'increase',
        reason: '',
        notes: '',
        items: [{ product_variant_id: '', quantity: '1', unit_cost: '' }],
    });

    const editForm = useForm<AdjustmentForm>({
        warehouse_id: '',
        adjustment_type: 'increase',
        reason: '',
        notes: '',
        items: [{ product_variant_id: '', quantity: '1', unit_cost: '' }],
    });

    const variantOptions = useMemo(
        () =>
            variants.data.map((variant) => ({
                value: variant.id.toString(),
                label: `${variant.sku} · ${variant.product?.name ?? 'Product'}`,
            })),
        [variants.data],
    );

    const variantLabelById = useMemo(
        () =>
            variants.data.reduce<Record<number, string>>((carry, variant) => {
                carry[variant.id] = `${variant.sku} · ${variant.product?.name ?? 'Product'}`;

                return carry;
            }, {}),
        [variants.data],
    );

    function applyFilters(payload: Filters) {
        router.get(adjustmentsIndex.url(), payload, {
            preserveState: true,
            replace: true,
        });
    }

    function sortByColumn(column: string) {
        const nextDirection: 'asc' | 'desc' =
            sortBy === column && sortDir === 'asc' ? 'desc' : 'asc';

        applyFilters({
            ...filters,
            sort_by: column,
            sort_dir: nextDirection,
            page: 1,
        });
    }

    function sortIndicator(column: string): string {
        if (sortBy !== column) {
            return '↕';
        }

        return sortDir === 'asc' ? '↑' : '↓';
    }

    function openCreate() {
        createForm.reset();
        createForm.setData('items', [
            { product_variant_id: '', quantity: '1', unit_cost: '' },
        ]);
        setCreating(true);
    }

    function openEdit(adjustment: Adjustment) {
        editForm.setData({
            warehouse_id: adjustment.warehouse_id.toString(),
            adjustment_type: adjustment.adjustment_type,
            reason: adjustment.reason ?? '',
            notes: adjustment.notes ?? '',
            items: (adjustment.items ?? []).map((item) => ({
                product_variant_id: item.product_variant_id.toString(),
                quantity: item.quantity,
                unit_cost: item.unit_cost ?? '',
            })),
        });
        setEditing(adjustment);
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreating(false);
            },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();

        if (!editing) {
            return;
        }

        editForm.put(update.url(editing), {
            preserveScroll: true,
            onSuccess: () => {
                setEditing(null);
            },
        });
    }

    function addCreateItem() {
        createForm.setData('items', [
            ...createForm.data.items,
            { product_variant_id: '', quantity: '1', unit_cost: '' },
        ]);
    }

    function addEditItem() {
        editForm.setData('items', [
            ...editForm.data.items,
            { product_variant_id: '', quantity: '1', unit_cost: '' },
        ]);
    }

    function removeCreateItem(index: number) {
        const items = createForm.data.items.filter((_, idx) => idx !== index);
        createForm.setData(
            'items',
            items.length > 0
                ? items
                : [{ product_variant_id: '', quantity: '1', unit_cost: '' }],
        );
    }

    function removeEditItem(index: number) {
        const items = editForm.data.items.filter((_, idx) => idx !== index);
        editForm.setData(
            'items',
            items.length > 0
                ? items
                : [{ product_variant_id: '', quantity: '1', unit_cost: '' }],
        );
    }

    function executeConfirm(adjustment: Adjustment) {
        const serializedItems = (adjustment.items ?? []).filter(
            (item) =>
                (serialCandidates[item.id.toString()] ?? []).length > 0,
        );

        if (serializedItems.length === 0) {
            router.post(
                confirmAdjustment.url(adjustment),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        notifyInventoryStockChanged();
                    },
                },
            );

            return;
        }

        const initialSelections = serializedItems.reduce<Record<string, string[]>>(
            (carry, item) => {
                carry[item.id.toString()] = [];

                return carry;
            },
            {},
        );

        setSelectedSerialsByItem(initialSelections);
        setConfirming(adjustment);
    }

    function submitConfirmWithSerials() {
        if (!confirming) {
            return;
        }

        const payloadItems = (confirming.items ?? [])
            .filter((item) => (serialCandidates[item.id.toString()] ?? []).length > 0)
            .map((item) => ({
                id: item.id,
                serial_ids: (selectedSerialsByItem[item.id.toString()] ?? []).map(
                    (serialId) => Number(serialId),
                ),
            }));

        router.post(
            confirmAdjustment.url(confirming),
            {
                items: payloadItems,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirming(null);
                    setSelectedSerialsByItem({});
                    notifyInventoryStockChanged();
                },
            },
        );
    }

    function executeCancel(adjustment: Adjustment) {
        router.post(cancel.url(adjustment), {}, { preserveScroll: true });
    }

    function executeDelete(adjustment: Adjustment) {
        router.delete(destroy.url(adjustment), { preserveScroll: true });
    }

    function openActionConfirmation(
        action: 'confirm' | 'cancel' | 'delete',
        adjustment: Adjustment,
    ) {
        setPendingAction({ action, adjustment });
    }

    function proceedPendingAction() {
        if (!pendingAction) {
            return;
        }

        const { action, adjustment } = pendingAction;
        setPendingAction(null);

        if (action === 'confirm') {
            executeConfirm(adjustment);

            return;
        }

        if (action === 'cancel') {
            executeCancel(adjustment);

            return;
        }

        executeDelete(adjustment);
    }

    return (
        <>
            <Head title="Inventory Adjustments" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-2xl font-bold">
                            Inventory Adjustments
                        </h1>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            New adjustment
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {adjustments.meta.total} adjustment records
                    </p>
                </div>

                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-4">
                        <Input
                            placeholder="Search by code"
                            defaultValue={filters.search ?? ''}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    applyFilters({
                                        ...filters,
                                        search: (
                                            e.currentTarget as HTMLInputElement
                                        ).value,
                                    });
                                }
                            }}
                        />

                        <Select
                            value={statusFilter}
                            onValueChange={(value) =>
                                applyFilters({
                                    ...filters,
                                    status: value === '_all' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">
                                    All statuses
                                </SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="confirmed">
                                    Confirmed
                                </SelectItem>
                                <SelectItem value="cancelled">
                                    Cancelled
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={adjustmentTypeFilter}
                            onValueChange={(value) =>
                                applyFilters({
                                    ...filters,
                                    adjustment_type:
                                        value === '_all' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All types</SelectItem>
                                <SelectItem value="increase">
                                    Increase
                                </SelectItem>
                                <SelectItem value="decrease">
                                    Decrease
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={warehouseFilter}
                            onValueChange={(value) =>
                                applyFilters({
                                    ...filters,
                                    warehouse_id: value === '_all' ? '' : value,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">
                                    All warehouses
                                </SelectItem>
                                {warehouses.data.map((warehouse) => (
                                    <SelectItem
                                        key={warehouse.id}
                                        value={warehouse.id.toString()}
                                    >
                                        {warehouse.name}
                                    </SelectItem>
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
                                    <TableHead className="text-center">
                                        <Button variant="ghost" size="sm" onClick={() => sortByColumn('code')}>
                                            Code {sortIndicator('code')}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center">Warehouse</TableHead>
                                    <TableHead className="text-center">
                                        <Button variant="ghost" size="sm" onClick={() => sortByColumn('adjustment_type')}>
                                            Type {sortIndicator('adjustment_type')}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center">
                                        <Button variant="ghost" size="sm" onClick={() => sortByColumn('status')}>
                                            Status {sortIndicator('status')}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Items
                                    </TableHead>
                                    <TableHead className="text-center">
                                        <Button variant="ghost" size="sm" onClick={() => sortByColumn('created_at')}>
                                            Date {sortIndicator('created_at')}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adjustments.data.map((adjustment) => (
                                    <TableRow key={adjustment.id}>
                                        <TableCell className="text-center font-mono text-xs">
                                            {adjustment.code}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {adjustment.warehouse?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {adjustment.adjustment_type}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline">
                                                {adjustment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setViewingItems(adjustment)}
                                            >
                                                {adjustment.items?.length ?? 0} items
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {new Date(
                                                adjustment.created_at,
                                            ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={movementsIndex.url(
                                                                    {
                                                                        query: {
                                                                            reference_type:
                                                                                'App\\Models\\InventoryAdjustment',
                                                                            reference_id:
                                                                                adjustment.id,
                                                                        },
                                                                    },
                                                                )}
                                                            >
                                                                Trace
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View movement trace</TooltipContent>
                                                </Tooltip>

                                                {adjustment.status ===
                                                    'draft' && (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        openEdit(
                                                                            adjustment,
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit adjustment</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        openActionConfirmation(
                                                                            'confirm',
                                                                            adjustment,
                                                                        )
                                                                    }
                                                                >
                                                                    Confirm
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Confirm adjustment</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={() =>
                                                                        openActionConfirmation(
                                                                            'cancel',
                                                                            adjustment,
                                                                        )
                                                                    }
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Cancel adjustment</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() =>
                                                                        openActionConfirmation(
                                                                            'delete',
                                                                            adjustment,
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete draft adjustment</TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {adjustment.status !==
                                                    'draft' && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setViewingItems(
                                                                        adjustment,
                                                                    )
                                                                }
                                                            >
                                                                View
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>View adjustment details</TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <TablePagination
                    currentPage={adjustments.meta.current_page}
                    lastPage={adjustments.meta.last_page}
                    onPageChange={(page) =>
                        applyFilters({
                            ...filters,
                            page,
                        })
                    }
                />
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create adjustment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Warehouse</Label>
                                <Select
                                    value={createForm.data.warehouse_id}
                                    onValueChange={(value) =>
                                        createForm.setData(
                                            'warehouse_id',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select warehouse" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map((warehouse) => (
                                            <SelectItem
                                                key={warehouse.id}
                                                value={warehouse.id.toString()}
                                            >
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={createForm.errors.warehouse_id}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={createForm.data.adjustment_type}
                                    onValueChange={(value) =>
                                        createForm.setData(
                                            'adjustment_type',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="increase">
                                            Increase
                                        </SelectItem>
                                        <SelectItem value="decrease">
                                            Decrease
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={createForm.errors.adjustment_type}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Input
                                    value={createForm.data.reason}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input
                                    value={createForm.data.notes}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'notes',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-3 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <Label>Items</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addCreateItem}
                                >
                                    Add item
                                </Button>
                            </div>
                            {createForm.data.items.map((item, index) => (
                                <div
                                    key={`create-adjustment-item-${index}`}
                                    className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_130px_130px_100px]"
                                >
                                    <Select
                                        value={item.product_variant_id}
                                        onValueChange={(value) => {
                                            const items = [
                                                ...createForm.data.items,
                                            ];
                                            items[index] = {
                                                ...items[index],
                                                product_variant_id: value,
                                            };
                                            createForm.setData('items', items);
                                        }}
                                    >
                                        <SelectTrigger className="w-full min-w-0">
                                            <SelectValue placeholder="Select variant" className="block truncate" />
                                        </SelectTrigger>
                                        <SelectContent className="w-(--radix-select-trigger-width) max-w-[90vw]">
                                            {variantOptions.map((variant) => (
                                                <SelectItem
                                                    key={variant.value}
                                                    value={variant.value}
                                                    className="max-w-full truncate"
                                                    title={variant.label}
                                                >
                                                    {variant.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const items = [
                                                ...createForm.data.items,
                                            ];
                                            items[index] = {
                                                ...items[index],
                                                quantity: e.target.value,
                                            };
                                            createForm.setData('items', items);
                                        }}
                                    />
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.0001"
                                        value={item.unit_cost}
                                        onChange={(e) => {
                                            const items = [
                                                ...createForm.data.items,
                                            ];
                                            items[index] = {
                                                ...items[index],
                                                unit_cost: e.target.value,
                                            };
                                            createForm.setData('items', items);
                                        }}
                                        placeholder="Unit cost"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => removeCreateItem(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <InputError message={createForm.errors.items} />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreating(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                            >
                                {createForm.processing
                                    ? 'Saving...'
                                    : 'Create adjustment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit adjustment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Warehouse</Label>
                                <Select
                                    value={editForm.data.warehouse_id}
                                    onValueChange={(value) =>
                                        editForm.setData('warehouse_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select warehouse" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map((warehouse) => (
                                            <SelectItem
                                                key={warehouse.id}
                                                value={warehouse.id.toString()}
                                            >
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editForm.errors.warehouse_id}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={editForm.data.adjustment_type}
                                    onValueChange={(value) =>
                                        editForm.setData(
                                            'adjustment_type',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="increase">
                                            Increase
                                        </SelectItem>
                                        <SelectItem value="decrease">
                                            Decrease
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editForm.errors.adjustment_type}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Input
                                    value={editForm.data.reason}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input
                                    value={editForm.data.notes}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'notes',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-3 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <Label>Items</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addEditItem}
                                >
                                    Add item
                                </Button>
                            </div>
                            {editForm.data.items.map((item, index) => (
                                <div
                                    key={`edit-adjustment-item-${index}`}
                                    className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_130px_130px_100px]"
                                >
                                    <Select
                                        value={item.product_variant_id}
                                        onValueChange={(value) => {
                                            const items = [
                                                ...editForm.data.items,
                                            ];
                                            items[index] = {
                                                ...items[index],
                                                product_variant_id: value,
                                            };
                                            editForm.setData('items', items);
                                        }}
                                    >
                                        <SelectTrigger className="w-full min-w-0">
                                            <SelectValue placeholder="Select variant" className="block truncate" />
                                        </SelectTrigger>
                                        <SelectContent className="w-(--radix-select-trigger-width) max-w-[90vw]">
                                            {variantOptions.map((variant) => (
                                                <SelectItem
                                                    key={variant.value}
                                                    value={variant.value}
                                                    className="max-w-full truncate"
                                                    title={variant.label}
                                                >
                                                    {variant.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const items = [
                                                ...editForm.data.items,
                                            ];
                                            items[index] = {
                                                ...items[index],
                                                quantity: e.target.value,
                                            };
                                            editForm.setData('items', items);
                                        }}
                                    />
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.0001"
                                        value={item.unit_cost}
                                        onChange={(e) => {
                                            const items = [
                                                ...editForm.data.items,
                                            ];
                                            items[index] = {
                                                ...items[index],
                                                unit_cost: e.target.value,
                                            };
                                            editForm.setData('items', items);
                                        }}
                                        placeholder="Unit cost"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => removeEditItem(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <InputError message={editForm.errors.items} />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditing(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                            >
                                {editForm.processing
                                    ? 'Saving...'
                                    : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!confirming}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirming(null);
                        setSelectedSerialsByItem({});
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Select serials to confirm adjustment</DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
                        {(confirming?.items ?? [])
                            .filter((item) => (serialCandidates[item.id.toString()] ?? []).length > 0)
                            .map((item) => {
                                const options =
                                    serialCandidates[item.id.toString()] ?? [];
                                const selected =
                                    selectedSerialsByItem[item.id.toString()] ?? [];
                                const required = Math.trunc(
                                    Number(item.quantity),
                                );

                                return (
                                    <div
                                        key={item.id}
                                        className="space-y-2 rounded-md border p-3"
                                    >
                                        <p className="text-sm font-medium">
                                            Item #{item.id} · Selected{' '}
                                            {selected.length} / {required}
                                        </p>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {options.map((serial) => {
                                                const serialId =
                                                    serial.id.toString();
                                                const checked =
                                                    selected.includes(serialId);

                                                return (
                                                    <label
                                                        key={serial.id}
                                                        className="flex items-center gap-3 rounded-md border p-2"
                                                    >
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={(
                                                                value,
                                                            ) => {
                                                                if (value) {
                                                                    setSelectedSerialsByItem(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [item.id]: prev[
                                                                                item.id
                                                                            ]?.includes(
                                                                                serialId,
                                                                            )
                                                                                ? prev[
                                                                                      item
                                                                                          .id
                                                                                  ]
                                                                                : [
                                                                                      ...(prev[
                                                                                          item
                                                                                              .id
                                                                                      ] ??
                                                                                          []),
                                                                                      serialId,
                                                                                  ],
                                                                        }),
                                                                    );

                                                                    return;
                                                                }

                                                                setSelectedSerialsByItem(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [item.id]: (
                                                                            prev[
                                                                                item
                                                                                    .id
                                                                            ] ??
                                                                            []
                                                                        ).filter(
                                                                            (
                                                                                id,
                                                                            ) =>
                                                                                id
                                                                                !==
                                                                                serialId,
                                                                        ),
                                                                    }),
                                                                );
                                                            }}
                                                        />
                                                        <span className="font-mono text-xs">
                                                            {serial.serial_number}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setConfirming(null);
                                setSelectedSerialsByItem({});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitConfirmWithSerials}
                            disabled={
                                (confirming?.items ?? [])
                                    .filter(
                                        (item) =>
                                            (serialCandidates[
                                                item.id.toString()
                                            ] ?? []).length > 0,
                                    )
                                    .some((item) => {
                                        const selected =
                                            selectedSerialsByItem[
                                                item.id.toString()
                                            ] ?? [];

                                        return (
                                            selected.length
                                            !==
                                            Math.trunc(Number(item.quantity))
                                        );
                                    })
                            }
                        >
                            Confirm adjustment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingItems} onOpenChange={() => setViewingItems(null)}>
                <DialogContent className="max-h-[80vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Adjustment items {viewingItems ? `· ${viewingItems.code}` : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">Variant</TableHead>
                                    <TableHead className="text-center">Quantity</TableHead>
                                    <TableHead className="text-center">Unit cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(viewingItems?.items ?? []).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-center">
                                            <div className="space-y-2">
                                                <p>
                                                    {variantLabelById[item.product_variant_id] ?? `Variant #${item.product_variant_id}`}
                                                </p>

                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {(adjustmentSerials[viewingItems?.id?.toString() ?? '']?.[item.product_variant_id.toString()] ?? []).map((serial) => (
                                                        <Badge
                                                            key={`adj-serial-${item.id}-${serial.id}`}
                                                            variant="outline"
                                                            className={serial.status === 'damaged'
                                                                ? 'border-rose-300 bg-rose-50 text-rose-700'
                                                                : 'border-amber-300 bg-amber-50 text-amber-700'}
                                                        >
                                                            {serial.serial_number ?? `Serial #${serial.id}`}
                                                            <span className="ml-1 text-[10px] uppercase tracking-wide">
                                                                {serial.status ?? 'tracked'}
                                                            </span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-center">{item.unit_cost ?? '—'}</TableCell>
                                    </TableRow>
                                ))}
                                {(viewingItems?.items ?? []).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                                            This adjustment has no items.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setViewingItems(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={!!pendingAction}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingAction(null);
                    }
                }}
                title={
                    pendingAction?.action === 'confirm'
                        ? 'Confirm adjustment'
                        : pendingAction?.action === 'cancel'
                            ? 'Cancel adjustment'
                            : 'Delete adjustment'
                }
                description={
                    pendingAction
                        ? pendingAction.action === 'confirm'
                            ? `Are you sure you want to confirm adjustment ${pendingAction.adjustment.code}?`
                            : pendingAction.action === 'cancel'
                                ? `Are you sure you want to cancel adjustment ${pendingAction.adjustment.code}?`
                                : `Are you sure you want to delete adjustment ${pendingAction.adjustment.code}? This action cannot be undone.`
                        : ''
                }
                confirmLabel={
                    pendingAction?.action === 'confirm'
                        ? 'Confirm adjustment'
                        : pendingAction?.action === 'cancel'
                            ? 'Cancel adjustment'
                            : 'Delete adjustment'
                }
                confirmVariant={
                    pendingAction?.action === 'delete'
                        ? 'destructive'
                        : pendingAction?.action === 'cancel'
                            ? 'secondary'
                            : 'default'
                }
                onConfirm={proceedPendingAction}
            />
        </>
    );
}

InventoryAdjustmentsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Adjustments', href: adjustmentsIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
