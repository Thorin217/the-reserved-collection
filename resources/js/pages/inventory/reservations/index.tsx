import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import AppLayout from '@/layouts/app-layout';
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
    search?: string;
};

type Props = {
    reservations: PaginatedData<Reservation>;
    warehouses: { data: Warehouse[] };
    variants: { data: Variant[] };
    serial_candidates: Record<string, Array<{ id: number; serial_number: string }>>;
    filters: Filters;
};

export default function InventoryReservationsIndex({ reservations, warehouses, variants, serial_candidates: serialCandidates, filters }: Props) {
    const [processingReservationId, setProcessingReservationId] = useState<
        number | null
    >(null);
    const [creating, setCreating] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        action: 'release' | 'consume' | 'cancel';
        reservationId: number;
    } | null>(null);
    const [selectedSerialIds, setSelectedSerialIds] = useState<string[]>([]);

    const statusFilter = filters.status ?? '_all';
    const warehouseFilter = filters.warehouse_id ?? '_all';

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
        })),
        [variants.data],
    );

    function applyFilters(payload: Filters) {
        router.get(reservationsIndex.url(), payload, { preserveState: true, replace: true });
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
                },
            },
        );
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
                    <CardContent className="grid gap-3 p-4 md:grid-cols-3">
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

                        <Select
                            value={statusFilter}
                            onValueChange={(value) => applyFilters({ ...filters, status: value === '_all' ? '' : value })}
                        >
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="released">Released</SelectItem>
                                <SelectItem value="consumed">Consumed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Expires</TableHead>
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

                                                {reservation.status ===
                                                'active' ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={
                                                                processingReservationId ===
                                                                reservation.id
                                                            }
                                                            onClick={() =>
                                                                executeAction(
                                                                    'release',
                                                                    reservation.id,
                                                                )
                                                            }
                                                        >
                                                            Release
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            disabled={
                                                                processingReservationId ===
                                                                reservation.id
                                                            }
                                                            onClick={() =>
                                                                executeAction(
                                                                    'consume',
                                                                    reservation.id,
                                                                )
                                                            }
                                                        >
                                                            Consume
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={
                                                                processingReservationId ===
                                                                reservation.id
                                                            }
                                                            onClick={() =>
                                                                executeAction(
                                                                    'cancel',
                                                                    reservation.id,
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
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

                {reservations.meta.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {reservations.links.prev && <Link href={reservations.links.prev} className="text-sm text-primary underline">← Previous</Link>}
                        <span className="text-sm text-muted-foreground">Page {reservations.meta.current_page} of {reservations.meta.last_page}</span>
                        {reservations.links.next && <Link href={reservations.links.next} className="text-sm text-primary underline">Next →</Link>}
                    </div>
                )}
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create reservation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Warehouse</Label>
                            <Select value={form.data.warehouse_id} onValueChange={(value) => form.setData('warehouse_id', value)}>
                                <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                                <SelectContent>
                                    {warehouses.data.map((warehouse) => (
                                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.warehouse_id} />
                        </div>

                        <div className="space-y-2">
                            <Label>Variant</Label>
                            <Select value={form.data.product_variant_id} onValueChange={(value) => form.setData('product_variant_id', value)}>
                                <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                                <SelectContent>
                                    {variantOptions.map((variant) => (
                                        <SelectItem key={variant.value} value={variant.value}>{variant.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select serials</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
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
