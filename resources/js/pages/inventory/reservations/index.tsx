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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { notifyInventoryStockChanged } from '@/lib/inventory-stock-sync';
import { index as movementsIndex } from '@/routes/admin/inventory/movements';
import {
    cancel as cancelReservation,
    consume,
    index as reservationsIndex,
    release,
    store,
} from '@/routes/admin/inventory/reservations';
import type { PaginatedData } from '@/types';

type Reservation = {
    id: number;
    warehouse_id: number;
    product_variant_id: number;
    status: string;
    quantity: string;
    expires_at: string | null;
    warehouse?: { name?: string };
    product_variant?: { sku?: string; product?: { name?: string } };
    created_at: string;
};

type Warehouse = {
    id: number;
    name: string;
};

type Brand = {
    id: number;
    name: string;
};

type Category = {
    id: number;
    name: string;
};

type Variant = {
    id: number;
    sku: string;
    product?: { name?: string };
};

type ReservationForm = {
    warehouse_id: string;
    product_variant_id: string;
    quantity: string;
    expires_at: string;
};

type Filters = {
    status?: string;
    warehouse_id?: string;
    brand_id?: string;
    category_id?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    page?: number;
};

type Props = {
    reservations: PaginatedData<Reservation>;
    warehouses: { data: Warehouse[] };
    brands: { data: Brand[] };
    categories: { data: Category[] };
    variants: { data: Variant[] };
    serial_candidates: Record<string, Array<{ id: number; serial_number: string }>>;
    filters: Filters;
};

export default function InventoryReservationsIndex({
    reservations,
    warehouses,
    brands,
    categories,
    variants,
    serial_candidates: serialCandidates,
    filters,
}: Props) {
    const [processingReservationId, setProcessingReservationId] = useState<
        number | null
    >(null);
    const [creating, setCreating] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        action: 'release' | 'consume' | 'cancel';
        reservationId: number;
    } | null>(null);
    const [pendingConfirmation, setPendingConfirmation] = useState<{
        action: 'release' | 'consume' | 'cancel';
        reservation: Reservation;
    } | null>(null);
    const [selectedSerialIds, setSelectedSerialIds] = useState<string[]>([]);

    const statusFilter = filters.status ?? '_all';
    const warehouseFilter = filters.warehouse_id ?? '_all';
    const brandFilter = filters.brand_id ?? '_all';
    const categoryFilter = filters.category_id ?? '_all';
    const sortBy = filters.sort_by ?? 'created_at';
    const sortDir = filters.sort_dir ?? 'desc';

    const form = useForm<ReservationForm>({
        warehouse_id: '',
        product_variant_id: '',
        quantity: '1',
        expires_at: '',
    });

    const variantOptions = useMemo(
        () => variants.data.map((variant) => ({
            value: variant.id.toString(),
            label: `${variant.sku} · ${variant.product?.name ?? 'Product'}`,
            keywords: `${variant.sku} ${variant.product?.name ?? ''}`,
        })),
        [variants.data],
    );

    const statusOptions = useMemo(
        () => [
            { value: '_all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'released', label: 'Released' },
            { value: 'consumed', label: 'Consumed' },
            { value: 'cancelled', label: 'Cancelled' },
        ],
        [],
    );

    const warehouseFilterOptions = useMemo(
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

    const brandFilterOptions = useMemo(
        () => [
            { value: '_all', label: 'All brands' },
            ...brands.data.map((brand) => ({
                value: brand.id.toString(),
                label: brand.name,
                keywords: brand.name,
            })),
        ],
        [brands.data],
    );

    const categoryFilterOptions = useMemo(
        () => [
            { value: '_all', label: 'All categories' },
            ...categories.data.map((category) => ({
                value: category.id.toString(),
                label: category.name,
                keywords: category.name,
            })),
        ],
        [categories.data],
    );

    const warehouseOptions = useMemo(
        () => warehouses.data.map((warehouse) => ({
            value: warehouse.id.toString(),
            label: warehouse.name,
            keywords: warehouse.name,
        })),
        [warehouses.data],
    );

    function applyFilters(payload: Filters) {
        router.get(reservationsIndex.url(), payload, { preserveState: true, replace: true });
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
        form.reset();
        setCreating(true);
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            expires_at: data.expires_at || null,
        }));

        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setCreating(false);
                notifyInventoryStockChanged();
            },
        });
    }

    function executeAction(
        action: 'release' | 'consume' | 'cancel',
        reservationId: number,
    ) {
        if (processingReservationId !== null) {
            return;
        }

        setProcessingReservationId(reservationId);

        const serialOptions = serialCandidates[reservationId.toString()] ?? [];

        if (serialOptions.length > 0) {
            setPendingAction({ action, reservationId });
            setSelectedSerialIds([]);
            setProcessingReservationId(null);

            return;
        }

        const wayfinder =
            action === 'release'
                ? release(reservationId)
                : action === 'consume'
                  ? consume(reservationId)
                  : cancelReservation(reservationId);

        router.post(
            wayfinder.url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    notifyInventoryStockChanged();
                },
                onFinish: () => setProcessingReservationId(null),
            },
        );
    }

    function submitActionWithSerials() {
        if (!pendingAction) {
            return;
        }

        setProcessingReservationId(pendingAction.reservationId);

        const wayfinder =
            pendingAction.action === 'release'
                ? release(pendingAction.reservationId)
                : pendingAction.action === 'consume'
                  ? consume(pendingAction.reservationId)
                  : cancelReservation(pendingAction.reservationId);

        router.post(
            wayfinder.url,
            {
                serial_ids: selectedSerialIds.map((id) => Number(id)),
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessingReservationId(null);
                },
                onSuccess: () => {
                    setPendingAction(null);
                    setSelectedSerialIds([]);
                    notifyInventoryStockChanged();
                },
            },
        );
    }

    function openActionConfirmation(
        action: 'release' | 'consume' | 'cancel',
        reservation: Reservation,
    ) {
        setPendingConfirmation({ action, reservation });
    }

    function proceedPendingConfirmation() {
        if (!pendingConfirmation) {
            return;
        }

        const { action, reservation } = pendingConfirmation;
        setPendingConfirmation(null);
        executeAction(action, reservation.id);
    }

    return (
        <>
            <Head title="Inventory Reservations" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-2xl font-bold">Inventory Reservations</h1>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            New reservation
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {reservations.meta.total} reservation records
                    </p>
                </div>

                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-5">
                        <Input
                            placeholder="Search by product or SKU"
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
                            value={statusFilter}
                            onValueChange={(value) => applyFilters({ ...filters, status: value === '_all' ? '' : value })}
                            options={statusOptions}
                            placeholder="Status"
                            searchPlaceholder="Search status"
                        />

                        <SearchableSelect
                            value={warehouseFilter}
                            onValueChange={(value) => applyFilters({ ...filters, warehouse_id: value === '_all' ? '' : value })}
                            options={warehouseFilterOptions}
                            placeholder="Warehouse"
                            searchPlaceholder="Search warehouse"
                        />

                        <SearchableSelect
                            value={brandFilter}
                            onValueChange={(value) => applyFilters({ ...filters, brand_id: value === '_all' ? '' : value })}
                            options={brandFilterOptions}
                            placeholder="Brand"
                            searchPlaceholder="Search brand"
                        />

                        <SearchableSelect
                            value={categoryFilter}
                            onValueChange={(value) => applyFilters({ ...filters, category_id: value === '_all' ? '' : value })}
                            options={categoryFilterOptions}
                            placeholder="Category"
                            searchPlaceholder="Search category"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => sortByColumn('quantity')}>
                                            Quantity {sortIndicator('quantity')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" size="sm" onClick={() => sortByColumn('status')}>
                                            Status {sortIndicator('status')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" size="sm" onClick={() => sortByColumn('expires_at')}>
                                            Expires {sortIndicator('expires_at')}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reservations.data.map((reservation) => (
                                    <TableRow key={reservation.id}>
                                        <TableCell>
                                            {reservation.product_variant
                                                ?.product?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {reservation.product_variant?.sku ??
                                                '—'}
                                        </TableCell>
                                        <TableCell>
                                            {reservation.warehouse?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {reservation.quantity}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {reservation.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {reservation.expires_at
                                                ? new Date(
                                                      reservation.expires_at,
                                                  ).toLocaleString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={movementsIndex.url({
                                                                    query: {
                                                                        reference_type:
                                                                            'App\\Models\\InventoryReservation',
                                                                        reference_id:
                                                                            reservation.id,
                                                                    },
                                                                })}
                                                            >
                                                                Trace
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View movement trace</TooltipContent>
                                                </Tooltip>

                                                {reservation.status ===
                                                'active' ? (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={
                                                                        processingReservationId ===
                                                                        reservation.id
                                                                    }
                                                                    onClick={() =>
                                                                        openActionConfirmation(
                                                                            'release',
                                                                            reservation,
                                                                        )
                                                                    }
                                                                >
                                                                    Release
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Release reserved stock</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    disabled={
                                                                        processingReservationId ===
                                                                        reservation.id
                                                                    }
                                                                    onClick={() =>
                                                                        openActionConfirmation(
                                                                            'consume',
                                                                            reservation,
                                                                        )
                                                                    }
                                                                >
                                                                    Consume
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Consume reserved stock</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    disabled={
                                                                        processingReservationId ===
                                                                        reservation.id
                                                                    }
                                                                    onClick={() =>
                                                                        openActionConfirmation(
                                                                            'cancel',
                                                                            reservation,
                                                                        )
                                                                    }
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Cancel reservation</TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        No actions
                                                    </span>
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
                    currentPage={reservations.meta.current_page}
                    lastPage={reservations.meta.last_page}
                    onPageChange={(page) => applyFilters({ ...filters, page })}
                />
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create reservation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Warehouse</Label>
                            <SearchableSelect
                                value={form.data.warehouse_id}
                                onValueChange={(value) => form.setData('warehouse_id', value)}
                                options={warehouseOptions}
                                placeholder="Select warehouse"
                                searchPlaceholder="Search warehouse"
                            />
                            <InputError message={form.errors.warehouse_id} />
                        </div>

                        <div className="space-y-2">
                            <Label>Variant</Label>
                            <SearchableSelect
                                value={form.data.product_variant_id}
                                onValueChange={(value) => form.setData('product_variant_id', value)}
                                options={variantOptions}
                                placeholder="Select variant"
                                searchPlaceholder="Search variant or product"
                            />
                            <InputError message={form.errors.product_variant_id} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={form.data.quantity}
                                    onChange={(e) => form.setData('quantity', e.target.value)}
                                />
                                <InputError message={form.errors.quantity} />
                            </div>
                            <div className="space-y-2">
                                <Label>Expires at</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.data.expires_at}
                                    onChange={(e) => form.setData('expires_at', e.target.value)}
                                />
                                <InputError message={form.errors.expires_at} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>{form.processing ? 'Saving...' : 'Create reservation'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!pendingAction}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingAction(null);
                        setSelectedSerialIds([]);
                    }
                }}
            >
                <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Select serials</DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                        {pendingAction &&
                            (serialCandidates[pendingAction.reservationId.toString()] ?? []).map((serial) => {
                                const checked = selectedSerialIds.includes(
                                    serial.id.toString(),
                                );

                                return (
                                    <label
                                        key={serial.id}
                                        className="flex items-center gap-3 rounded-md border p-2"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(value) => {
                                                const serialId =
                                                    serial.id.toString();

                                                if (value) {
                                                    setSelectedSerialIds((prev) =>
                                                        prev.includes(serialId)
                                                            ? prev
                                                            : [...prev, serialId],
                                                    );

                                                    return;
                                                }

                                                setSelectedSerialIds((prev) =>
                                                    prev.filter(
                                                        (id) =>
                                                            id !== serialId,
                                                    ),
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

                    {pendingAction && (
                        <p className="text-xs text-muted-foreground">
                            Selected: {selectedSerialIds.length} /{' '}
                            {Math.trunc(
                                Number(
                                    reservations.data.find(
                                        (reservation) =>
                                            reservation.id ===
                                            pendingAction.reservationId,
                                    )?.quantity ?? 0,
                                ),
                            )}
                        </p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setPendingAction(null);
                                setSelectedSerialIds([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitActionWithSerials}
                            disabled={
                                !pendingAction
                                || selectedSerialIds.length
                                    !== Math.trunc(
                                        Number(
                                            reservations.data.find(
                                                (reservation) =>
                                                    reservation.id
                                                    ===
                                                    pendingAction.reservationId,
                                            )?.quantity ?? 0,
                                        ),
                                    )
                            }
                        >
                            Confirm action
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={!!pendingConfirmation}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingConfirmation(null);
                    }
                }}
                title={
                    pendingConfirmation?.action === 'release'
                        ? 'Release reservation'
                        : pendingConfirmation?.action === 'consume'
                            ? 'Consume reservation'
                            : 'Cancel reservation'
                }
                description={
                    pendingConfirmation
                        ? pendingConfirmation.action === 'release'
                            ? `Are you sure you want to release reservation #${pendingConfirmation.reservation.id}?`
                            : pendingConfirmation.action === 'consume'
                                ? `Are you sure you want to consume reservation #${pendingConfirmation.reservation.id}?`
                                : `Are you sure you want to cancel reservation #${pendingConfirmation.reservation.id}?`
                        : ''
                }
                confirmLabel={
                    pendingConfirmation?.action === 'release'
                        ? 'Release'
                        : pendingConfirmation?.action === 'consume'
                            ? 'Consume'
                            : 'Cancel reservation'
                }
                confirmVariant={
                    pendingConfirmation?.action === 'cancel'
                        ? 'destructive'
                        : pendingConfirmation?.action === 'release'
                            ? 'outline'
                            : 'default'
                }
                onConfirm={proceedPendingConfirmation}
            />
        </>
    );
}

InventoryReservationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Reservations', href: reservationsIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
