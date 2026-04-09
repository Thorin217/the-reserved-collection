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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { index as movementsIndex } from '@/routes/admin/inventory/movements';
import {
    destroy,
    index as transfersIndex,
    receive,
    send,
    store,
    update,
} from '@/routes/admin/inventory/transfers';
import type { PaginatedData } from '@/types';

type Transfer = {
    id: number;
    code: string;
    status: string;
    notes: string | null;
    from_warehouse_id: number;
    to_warehouse_id: number;
    from_warehouse?: { name?: string };
    to_warehouse?: { name?: string };
    items?: Array<{ id: number; product_variant_id: number; quantity: string; received_quantity: string | null }>;
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

type TransferForm = {
    from_warehouse_id: string;
    to_warehouse_id: string;
    notes: string;
    items: Array<{ product_variant_id: string; quantity: string }>;
};

type Filters = {
    status?: string;
    from_warehouse_id?: string;
    to_warehouse_id?: string;
    search?: string;
};

type Props = {
    transfers: PaginatedData<Transfer>;
    warehouses: { data: Warehouse[] };
    variants: { data: Variant[] };
    serial_candidates: {
        send: Record<string, Array<{ id: number; serial_number: string }>>;
        receive: Record<string, Array<{ id: number; serial_number: string }>>;
    };
    filters: Filters;
};

export default function InventoryTransfersIndex({ transfers, warehouses, variants, serial_candidates: serialCandidates, filters }: Props) {
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Transfer | null>(null);
    const [sendingTransfer, setSendingTransfer] = useState<Transfer | null>(null);
    const [receivingTransfer, setReceivingTransfer] = useState<Transfer | null>(null);
    const [selectedSendSerialsByItem, setSelectedSendSerialsByItem] = useState<Record<string, string[]>>({});
    const [selectedReceiveSerialsByItem, setSelectedReceiveSerialsByItem] = useState<Record<string, string[]>>({});

    const statusFilter = filters.status ?? '_all';
    const fromWarehouseFilter = filters.from_warehouse_id ?? '_all';
    const toWarehouseFilter = filters.to_warehouse_id ?? '_all';

    const createForm = useForm<TransferForm>({
        from_warehouse_id: '',
        to_warehouse_id: '',
        notes: '',
        items: [{ product_variant_id: '', quantity: '1' }],
    });

    const editForm = useForm<TransferForm>({
        from_warehouse_id: '',
        to_warehouse_id: '',
        notes: '',
        items: [{ product_variant_id: '', quantity: '1' }],
    });

    const variantOptions = useMemo(
        () => variants.data.map((variant) => ({
            value: variant.id.toString(),
            label: `${variant.sku} · ${variant.product?.name ?? 'Product'}`,
        })),
        [variants.data],
    );

    function applyFilters(payload: Filters) {
        router.get(transfersIndex.url(), payload, { preserveState: true, replace: true });
    }

    function openCreate() {
        createForm.reset();
        createForm.setData('items', [{ product_variant_id: '', quantity: '1' }]);
        setCreating(true);
    }

    function openEdit(transfer: Transfer) {
        editForm.setData({
            from_warehouse_id: transfer.from_warehouse_id.toString(),
            to_warehouse_id: transfer.to_warehouse_id.toString(),
            notes: transfer.notes ?? '',
            items: (transfer.items ?? []).map((item) => ({
                product_variant_id: item.product_variant_id.toString(),
                quantity: item.quantity,
            })),
        });
        setEditing(transfer);
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
        createForm.setData('items', [...createForm.data.items, { product_variant_id: '', quantity: '1' }]);
    }

    function addEditItem() {
        editForm.setData('items', [...editForm.data.items, { product_variant_id: '', quantity: '1' }]);
    }

    function removeCreateItem(index: number) {
        const items = createForm.data.items.filter((_, idx) => idx !== index);
        createForm.setData('items', items.length > 0 ? items : [{ product_variant_id: '', quantity: '1' }]);
    }

    function removeEditItem(index: number) {
        const items = editForm.data.items.filter((_, idx) => idx !== index);
        editForm.setData('items', items.length > 0 ? items : [{ product_variant_id: '', quantity: '1' }]);
    }

    function executeSend(transfer: Transfer) {
        const serializedItems = (transfer.items ?? []).filter(
            (item) => (serialCandidates.send[item.id.toString()] ?? []).length > 0,
        );

        if (serializedItems.length === 0) {
            router.post(send.url(transfer), {}, { preserveScroll: true });

            return;
        }

        const initialSelections = serializedItems.reduce<Record<string, string[]>>(
            (carry, item) => {
                carry[item.id.toString()] = [];

                return carry;
            },
            {},
        );

        setSelectedSendSerialsByItem(initialSelections);
        setSendingTransfer(transfer);
    }

    function executeReceive(transfer: Transfer) {
        const serializedItems = (transfer.items ?? []).filter(
            (item) =>
                (serialCandidates.receive[item.id.toString()] ?? []).length >
                0,
        );

        if (serializedItems.length === 0) {
            const items = (transfer.items ?? []).map((item) => ({
                id: item.id,
                received_quantity: item.quantity,
            }));

            router.post(receive.url(transfer), { items }, { preserveScroll: true });

            return;
        }

        const initialSelections = serializedItems.reduce<
            Record<string, string[]>
        >((carry, item) => {
            carry[item.id.toString()] = [];

            return carry;
        }, {});

        setSelectedReceiveSerialsByItem(initialSelections);
        setReceivingTransfer(transfer);
    }

    function confirmSendWithSerials() {
        if (!sendingTransfer) {
            return;
        }

        const items = (sendingTransfer.items ?? [])
            .filter(
                (item) =>
                    (serialCandidates.send[item.id.toString()] ?? []).length >
                    0,
            )
            .map((item) => ({
                id: item.id,
                serial_ids: (
                    selectedSendSerialsByItem[item.id.toString()] ?? []
                ).map((serialId) => Number(serialId)),
            }));

        router.post(
            send.url(sendingTransfer),
            { items },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSendingTransfer(null);
                    setSelectedSendSerialsByItem({});
                },
            },
        );
    }

    function confirmReceiveWithSerials() {
        if (!receivingTransfer) {
            return;
        }

        const items = (receivingTransfer.items ?? []).map((item) => {
            const payload: {
                id: number;
                received_quantity: string;
                serial_ids?: number[];
            } = {
                id: item.id,
                received_quantity: item.quantity,
            };

            if ((serialCandidates.receive[item.id.toString()] ?? []).length > 0) {
                payload.serial_ids = (
                    selectedReceiveSerialsByItem[item.id.toString()] ?? []
                ).map((serialId) => Number(serialId));
            }

            return payload;
        });

        router.post(
            receive.url(receivingTransfer),
            { items },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReceivingTransfer(null);
                    setSelectedReceiveSerialsByItem({});
                },
            },
        );
    }

    function executeDelete(transfer: Transfer) {
        if (!confirm(`Delete transfer ${transfer.code}?`)) {
            return;
        }

        router.delete(destroy.url(transfer), { preserveScroll: true });
    }

    return (
        <>
            <Head title="Inventory Transfers" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-2xl font-bold">Inventory Transfers</h1>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            New transfer
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {transfers.meta.total} transfer records
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
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="received">Received</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={fromWarehouseFilter}
                            onValueChange={(value) => applyFilters({ ...filters, from_warehouse_id: value === '_all' ? '' : value })}
                        >
                            <SelectTrigger><SelectValue placeholder="From warehouse" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All origins</SelectItem>
                                {warehouses.data.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={toWarehouseFilter}
                            onValueChange={(value) => applyFilters({ ...filters, to_warehouse_id: value === '_all' ? '' : value })}
                        >
                            <SelectTrigger><SelectValue placeholder="To warehouse" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_all">All destinations</SelectItem>
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
                                    <TableHead>Code</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Items</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transfers.data.map((transfer) => (
                                    <TableRow key={transfer.id}>
                                        <TableCell className="font-mono text-xs">
                                            {transfer.code}
                                        </TableCell>
                                        <TableCell>
                                            {transfer.from_warehouse?.name ??
                                                '—'}
                                        </TableCell>
                                        <TableCell>
                                            {transfer.to_warehouse?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {transfer.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {transfer.items?.length ?? 0}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                transfer.created_at,
                                            ).toLocaleString()}
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
                                                                            'App\\Models\\InventoryTransfer',
                                                                        reference_id:
                                                                            transfer.id,
                                                                    },
                                                                })}
                                                            >
                                                                Trace
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View movement trace</TooltipContent>
                                                </Tooltip>

                                                {transfer.status === 'draft' && (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="outline" onClick={() => openEdit(transfer)}>Edit</Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit transfer</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" onClick={() => executeSend(transfer)}>Send</Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Mark transfer as sent</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="sm" variant="destructive" onClick={() => executeDelete(transfer)}>Delete</Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete draft transfer</TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {transfer.status === 'sent' && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button size="sm" onClick={() => executeReceive(transfer)}>Receive</Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Mark transfer as received</TooltipContent>
                                                    </Tooltip>
                                                )}
                                                {transfer.status === 'received' && (
                                                    <span className="text-xs text-muted-foreground">Completed</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {transfers.meta.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {transfers.links.prev && <Link href={transfers.links.prev} className="text-sm text-primary underline">← Previous</Link>}
                        <span className="text-sm text-muted-foreground">Page {transfers.meta.current_page} of {transfers.meta.last_page}</span>
                        {transfers.links.next && <Link href={transfers.links.next} className="text-sm text-primary underline">Next →</Link>}
                    </div>
                )}
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create transfer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>From warehouse</Label>
                                <Select value={createForm.data.from_warehouse_id} onValueChange={(value) => createForm.setData('from_warehouse_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.from_warehouse_id} />
                            </div>
                            <div className="space-y-2">
                                <Label>To warehouse</Label>
                                <Select value={createForm.data.to_warehouse_id} onValueChange={(value) => createForm.setData('to_warehouse_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.to_warehouse_id} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={createForm.data.notes} onChange={(e) => createForm.setData('notes', e.target.value)} />
                        </div>

                        <div className="space-y-3 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <Label>Items</Label>
                                <Button type="button" size="sm" variant="outline" onClick={addCreateItem}>Add item</Button>
                            </div>
                            {createForm.data.items.map((item, index) => (
                                <div key={`create-item-${index}`} className="grid gap-3 md:grid-cols-[1fr_160px_100px]">
                                    <Select
                                        value={item.product_variant_id}
                                        onValueChange={(value) => {
                                            const items = [...createForm.data.items];
                                            items[index] = { ...items[index], product_variant_id: value };
                                            createForm.setData('items', items);
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                                        <SelectContent>
                                            {variantOptions.map((variant) => (
                                                <SelectItem key={variant.value} value={variant.value}>{variant.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const items = [...createForm.data.items];
                                            items[index] = { ...items[index], quantity: e.target.value };
                                            createForm.setData('items', items);
                                        }}
                                    />
                                    <Button type="button" variant="destructive" onClick={() => removeCreateItem(index)}>Remove</Button>
                                </div>
                            ))}
                            <InputError message={createForm.errors.items} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                            <Button type="submit" disabled={createForm.processing}>{createForm.processing ? 'Saving...' : 'Create transfer'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit transfer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>From warehouse</Label>
                                <Select value={editForm.data.from_warehouse_id} onValueChange={(value) => editForm.setData('from_warehouse_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.from_warehouse_id} />
                            </div>
                            <div className="space-y-2">
                                <Label>To warehouse</Label>
                                <Select value={editForm.data.to_warehouse_id} onValueChange={(value) => editForm.setData('to_warehouse_id', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>{warehouse.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.to_warehouse_id} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={editForm.data.notes} onChange={(e) => editForm.setData('notes', e.target.value)} />
                        </div>

                        <div className="space-y-3 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <Label>Items</Label>
                                <Button type="button" size="sm" variant="outline" onClick={addEditItem}>Add item</Button>
                            </div>
                            {editForm.data.items.map((item, index) => (
                                <div key={`edit-item-${index}`} className="grid gap-3 md:grid-cols-[1fr_160px_100px]">
                                    <Select
                                        value={item.product_variant_id}
                                        onValueChange={(value) => {
                                            const items = [...editForm.data.items];
                                            items[index] = { ...items[index], product_variant_id: value };
                                            editForm.setData('items', items);
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                                        <SelectContent>
                                            {variantOptions.map((variant) => (
                                                <SelectItem key={variant.value} value={variant.value}>{variant.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const items = [...editForm.data.items];
                                            items[index] = { ...items[index], quantity: e.target.value };
                                            editForm.setData('items', items);
                                        }}
                                    />
                                    <Button type="button" variant="destructive" onClick={() => removeEditItem(index)}>Remove</Button>
                                </div>
                            ))}
                            <InputError message={editForm.errors.items} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>{editForm.processing ? 'Saving...' : 'Save changes'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!sendingTransfer}
                onOpenChange={(open) => {
                    if (!open) {
                        setSendingTransfer(null);
                        setSelectedSendSerialsByItem({});
                    }
                }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Select serials to send</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {(sendingTransfer?.items ?? [])
                            .filter(
                                (item) =>
                                    (serialCandidates.send[
                                        item.id.toString()
                                    ] ?? []).length > 0,
                            )
                            .map((item) => {
                                const itemKey = item.id.toString();
                                const options =
                                    serialCandidates.send[itemKey] ?? [];
                                const selected =
                                    selectedSendSerialsByItem[itemKey] ?? [];
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
                                                                    setSelectedSendSerialsByItem(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [itemKey]: prev[
                                                                                itemKey
                                                                            ]?.includes(
                                                                                serialId,
                                                                            )
                                                                                ? prev[
                                                                                      itemKey
                                                                                  ]
                                                                                : [
                                                                                      ...(prev[
                                                                                          itemKey
                                                                                      ] ??
                                                                                          []),
                                                                                      serialId,
                                                                                  ],
                                                                        }),
                                                                    );

                                                                    return;
                                                                }

                                                                setSelectedSendSerialsByItem(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [itemKey]: (
                                                                            prev[
                                                                                itemKey
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
                                setSendingTransfer(null);
                                setSelectedSendSerialsByItem({});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmSendWithSerials}
                            disabled={
                                (sendingTransfer?.items ?? [])
                                    .filter(
                                        (item) =>
                                            (serialCandidates.send[
                                                item.id.toString()
                                            ] ?? []).length > 0,
                                    )
                                    .some((item) => {
                                        const selected =
                                            selectedSendSerialsByItem[
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
                            Confirm send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!receivingTransfer}
                onOpenChange={(open) => {
                    if (!open) {
                        setReceivingTransfer(null);
                        setSelectedReceiveSerialsByItem({});
                    }
                }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Select serials to receive</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {(receivingTransfer?.items ?? [])
                            .filter(
                                (item) =>
                                    (serialCandidates.receive[
                                        item.id.toString()
                                    ] ?? []).length > 0,
                            )
                            .map((item) => {
                                const itemKey = item.id.toString();
                                const options =
                                    serialCandidates.receive[itemKey] ?? [];
                                const selected =
                                    selectedReceiveSerialsByItem[itemKey] ?? [];
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
                                                                    setSelectedReceiveSerialsByItem(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [itemKey]: prev[
                                                                                itemKey
                                                                            ]?.includes(
                                                                                serialId,
                                                                            )
                                                                                ? prev[
                                                                                      itemKey
                                                                                  ]
                                                                                : [
                                                                                      ...(prev[
                                                                                          itemKey
                                                                                      ] ??
                                                                                          []),
                                                                                      serialId,
                                                                                  ],
                                                                        }),
                                                                    );

                                                                    return;
                                                                }

                                                                setSelectedReceiveSerialsByItem(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [itemKey]: (
                                                                            prev[
                                                                                itemKey
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
                                setReceivingTransfer(null);
                                setSelectedReceiveSerialsByItem({});
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmReceiveWithSerials}
                            disabled={
                                (receivingTransfer?.items ?? [])
                                    .filter(
                                        (item) =>
                                            (serialCandidates.receive[
                                                item.id.toString()
                                            ] ?? []).length > 0,
                                    )
                                    .some((item) => {
                                        const selected =
                                            selectedReceiveSerialsByItem[
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
                            Confirm receive
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

InventoryTransfersIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Transfers', href: transfersIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
