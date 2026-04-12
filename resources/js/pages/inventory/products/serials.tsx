import { Head, Link, router, useForm } from '@inertiajs/react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import * as ProductSerialController from '@/actions/App/Http/Controllers/Admin/ProductSerialController';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndex } from '@/routes/admin/products';
import type { Attribute, InventoryMovement, PaginatedData, Product, ProductSerial, Warehouse } from '@/types';

const SERIAL_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    available: { label: 'Available', variant: 'default' },
    reserved: { label: 'Reserved', variant: 'secondary' },
    sold: { label: 'Sold', variant: 'outline' },
    returned: { label: 'Returned', variant: 'secondary' },
    damaged: { label: 'Damaged', variant: 'destructive' },
    in_transit: { label: 'In transit', variant: 'secondary' },
};

type Props = {
    product: { data: Product };
    serials: PaginatedData<ProductSerial>;
    movements: { data: InventoryMovement[] };
    warehouses: { data: Warehouse[] };
    serialAttributes: { data: Attribute[] };
};

type SerialAttributeRow = {
    attribute_id: string;
    attribute_option_id: string;
};

const MAX_PREVIEW_ATTRIBUTES = 3;

export default function ProductSerials({ product: { data: product }, serials, movements, warehouses, serialAttributes }: Props) {
    const [addingSerial, setAddingSerial] = useState(false);
    const [editingSerial, setEditingSerial] = useState<ProductSerial | null>(null);
    const [pendingDeleteSerial, setPendingDeleteSerial] = useState<ProductSerial | null>(null);
    const [attributesPreviewSerial, setAttributesPreviewSerial] = useState<ProductSerial | null>(null);

    const firstVariant = product.variants?.[0];

    const storeForm = useForm({
        product_variant_id: firstVariant?.id.toString() ?? '',
        serial_number: '',
        imei_or_reference: '',
        warehouse_id: '',
        status: 'available',
        attributes: [] as SerialAttributeRow[],
    });

    const editForm = useForm({
        serial_number: '',
        imei_or_reference: '',
        warehouse_id: '',
        status: 'available',
        attributes: [] as SerialAttributeRow[],
    });

    function mapAttributeValuesToRows(serial: ProductSerial): SerialAttributeRow[] {
        return (serial.attribute_values ?? [])
            .map((attributeValue) => ({
                attribute_id: attributeValue.attribute_id.toString(),
                attribute_option_id: attributeValue.attribute_option_id ? attributeValue.attribute_option_id.toString() : '',
            }))
            .filter((attributeRow) => attributeRow.attribute_id !== '');
    }

    function openAdd() {
        storeForm.reset();
        storeForm.setData('product_variant_id', firstVariant?.id.toString() ?? '');
        storeForm.setData('status', 'available');
        storeForm.setData('attributes', []);
        setAddingSerial(true);
    }

    function openEdit(serial: ProductSerial) {
        editForm.setData({
            serial_number: serial.serial_number,
            imei_or_reference: serial.imei_or_reference ?? '',
            warehouse_id: serial.warehouse_id?.toString() ?? '',
            status: serial.status,
            attributes: mapAttributeValuesToRows(serial),
        });
        setEditingSerial(serial);
    }

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        storeForm.transform((payload) => ({
            ...payload,
            attributes: payload.attributes.filter((attribute) => attribute.attribute_id !== ''),
        }));

        storeForm.post(ProductSerialController.store.url(product), {
            onSuccess: () => {
 storeForm.reset(); setAddingSerial(false);
},
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();

        if (!editingSerial) {
 return;
}

        editForm.transform((payload) => ({
            ...payload,
            attributes: payload.attributes.filter((attribute) => attribute.attribute_id !== ''),
        }));

        editForm.put(ProductSerialController.update.url({ product, serial: editingSerial }), {
            onSuccess: () => {
 editForm.reset(); setEditingSerial(null);
},
        });
    }

    function deleteSerial(serial: ProductSerial) {
        router.delete(ProductSerialController.destroy.url({ product, serial }));
    }

    function requestDeleteSerial(serial: ProductSerial) {
        setPendingDeleteSerial(serial);
    }

    function confirmDeleteSerial() {
        if (!pendingDeleteSerial) {
            return;
        }

        deleteSerial(pendingDeleteSerial);
        setPendingDeleteSerial(null);
    }

    function addAttributeRow(form: typeof storeForm | typeof editForm): void {
        form.setData('attributes', [
            ...form.data.attributes,
            {
                attribute_id: '',
                attribute_option_id: '',
            },
        ]);
    }

    function removeAttributeRow(form: typeof storeForm | typeof editForm, index: number): void {
        form.setData('attributes', form.data.attributes.filter((_, itemIndex) => itemIndex !== index));
    }

    function updateAttributeSelection(form: typeof storeForm | typeof editForm, index: number, attributeId: string): void {
        const nextAttributes = [...form.data.attributes];
        nextAttributes[index] = {
            attribute_id: attributeId,
            attribute_option_id: '',
        };

        form.setData('attributes', nextAttributes);
    }

    function updateAttributeOption(form: typeof storeForm | typeof editForm, index: number, optionId: string): void {
        const nextAttributes = [...form.data.attributes];
        nextAttributes[index] = {
            ...nextAttributes[index],
            attribute_option_id: optionId,
        };

        form.setData('attributes', nextAttributes);
    }

    function renderAttributesForm(form: typeof storeForm | typeof editForm, formType: 'store' | 'edit') {
        if (serialAttributes.data.length === 0) {
            return (
                <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    No serial attributes configured yet. Create them in Configuration → Attributes.
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Serial attributes</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => addAttributeRow(form)}>
                        Add attribute
                    </Button>
                </div>

                {form.data.attributes.map((attributeRow, index) => {
                    const fieldKey = `${formType === 'store' ? 'attributes' : 'attributes'}.${index}`;
                    const selectedAttribute = serialAttributes.data.find((attribute) => attribute.id.toString() === attributeRow.attribute_id);
                    const usedAttributeIds = form.data.attributes
                        .filter((_, rowIndex) => rowIndex !== index)
                        .map((row) => row.attribute_id)
                        .filter((attributeId) => attributeId !== '');

                    const availableAttributes = serialAttributes.data.filter(
                        (attribute) => attribute.id.toString() === attributeRow.attribute_id || !usedAttributeIds.includes(attribute.id.toString()),
                    );

                    return (
                        <div key={`serial-attribute-${formType}-${index}`} className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                                <Label>Attribute</Label>
                                <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeAttributeRow(form, index)}>
                                    Remove
                                </Button>
                            </div>

                            <Select value={attributeRow.attribute_id} onValueChange={(value) => updateAttributeSelection(form, index, value)}>
                                <SelectTrigger><SelectValue placeholder="Select attribute" /></SelectTrigger>
                                <SelectContent>
                                    {availableAttributes.map((attribute) => (
                                        <SelectItem key={attribute.id} value={attribute.id.toString()}>
                                            {attribute.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors[`${fieldKey}.attribute_id` as keyof typeof form.errors]} />

                            {selectedAttribute && (
                                <>
                                    <Select value={attributeRow.attribute_option_id} onValueChange={(value) => updateAttributeOption(form, index, value)}>
                                        <SelectTrigger><SelectValue placeholder={`Select ${selectedAttribute.name} value`} /></SelectTrigger>
                                        <SelectContent>
                                            {(selectedAttribute.attribute_options ?? []).map((option) => (
                                                <SelectItem key={option.id} value={option.id.toString()}>
                                                    {option.label ?? option.value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors[`${fieldKey}.attribute_option_id` as keyof typeof form.errors]} />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    function serialAttributesPreview(serial: ProductSerial) {
        return (serial.attribute_values ?? [])
            .filter((item) => item.attribute && item.attribute_option)
            .slice(0, MAX_PREVIEW_ATTRIBUTES);
    }

    const serialCounts = {
        available: serials.data.filter(s => s.status === 'available').length,
        sold: serials.data.filter(s => s.status === 'sold').length,
        reserved: serials.data.filter(s => s.status === 'reserved').length,
    };

    return (
        <>
            <Head title={`Serials – ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={ProductController.edit.url(product)} className="text-muted-foreground hover:text-foreground text-sm">
                                ← {product.name}
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold">Serials / Traceability</h1>
                        <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                    </div>
                    <Button onClick={openAdd} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Register serial
                    </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-3xl font-bold text-green-600">{serialCounts.available}</p>
                            <p className="text-sm text-muted-foreground">Available</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-3xl font-bold text-yellow-600">{serialCounts.reserved}</p>
                            <p className="text-sm text-muted-foreground">Reserved</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-3xl font-bold text-muted-foreground">{serialCounts.sold}</p>
                            <p className="text-sm text-muted-foreground">Sold</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Registered units ({serials.meta.total})</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-2 text-left font-medium">Serial</th>
                                            <th className="px-4 py-2 text-left font-medium">Reference</th>
                                            <th className="px-4 py-2 text-left font-medium">Warehouse</th>
                                            <th className="px-4 py-2 text-left font-medium">Attributes</th>
                                            <th className="px-4 py-2 text-center font-medium">Status</th>
                                            <th className="px-4 py-2 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {serials.data.map(serial => {
                                            const s = SERIAL_STATUS[serial.status] ?? SERIAL_STATUS.available;

                                            return (
                                                <tr key={serial.id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-2 font-mono text-xs font-medium">{serial.serial_number}</td>
                                                    <td className="px-4 py-2 text-muted-foreground text-xs">{serial.imei_or_reference ?? '—'}</td>
                                                    <td className="px-4 py-2">{serial.warehouse?.name ?? '—'}</td>
                                                    <td className="px-4 py-2">
                                                        {serialAttributesPreview(serial).length === 0 ? (
                                                            <span className="text-xs text-muted-foreground">No attributes</span>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                {serialAttributesPreview(serial).map((item) => (
                                                                    <div key={item.id} className="text-xs">
                                                                        <span className="font-medium">{item.attribute?.name}:</span>{' '}
                                                                        <span className="text-muted-foreground">{item.attribute_option?.label ?? item.attribute_option?.value}</span>
                                                                    </div>
                                                                ))}
                                                                {(serial.attribute_values?.length ?? 0) > MAX_PREVIEW_ATTRIBUTES && (
                                                                    <button type="button" className="text-xs text-primary underline" onClick={() => setAttributesPreviewSerial(serial)}>
                                                                        View all
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <Badge variant={s.variant}>{s.label}</Badge>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(serial)}>
                                                                        Edit
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit serial</TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => requestDeleteSerial(serial)}>
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Delete serial</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {serials.data.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                    No serials. <button className="text-primary underline" onClick={openAdd}>Register first serial</button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Recent history
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {movements.data.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No movements recorded</p>
                                )}
                                {movements.data.map(movement => (
                                    <div key={movement.id} className="flex items-start gap-3 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                                        <div>
                                            <p className="font-medium capitalize">{movement.movement_type.replace('_', ' ')}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {movement.warehouse?.name} • {movement.user?.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(movement.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={addingSerial} onOpenChange={setAddingSerial}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Register serial</DialogTitle></DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-4">
                        {product.variants && product.variants.length > 1 && (
                            <div className="space-y-2">
                                <Label>Variant</Label>
                                <Select value={storeForm.data.product_variant_id} onValueChange={v => storeForm.setData('product_variant_id', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {product.variants.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.sku}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Serial number *</Label>
                            <Input value={storeForm.data.serial_number} onChange={e => storeForm.setData('serial_number', e.target.value)} placeholder="SN-XXXXX" className="font-mono" />
                            <InputError message={storeForm.errors.serial_number} />
                        </div>
                        <div className="space-y-2">
                            <Label>IMEI / Reference</Label>
                            <Input value={storeForm.data.imei_or_reference} onChange={e => storeForm.setData('imei_or_reference', e.target.value)} placeholder="REF-XXXXX" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Warehouse</Label>
                                <Select value={storeForm.data.warehouse_id} onValueChange={v => storeForm.setData('warehouse_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map(w => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={storeForm.data.status} onValueChange={v => storeForm.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SERIAL_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {renderAttributesForm(storeForm, 'store')}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddingSerial(false)}>Cancel</Button>
                            <Button type="submit" disabled={storeForm.processing}>{storeForm.processing ? 'Saving...' : 'Register'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingSerial} onOpenChange={() => setEditingSerial(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Update serial</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Serial number</Label>
                            <Input value={editForm.data.serial_number} onChange={e => editForm.setData('serial_number', e.target.value)} className="font-mono" />
                            <InputError message={editForm.errors.serial_number} />
                        </div>
                        <div className="space-y-2">
                            <Label>IMEI / Reference</Label>
                            <Input value={editForm.data.imei_or_reference} onChange={e => editForm.setData('imei_or_reference', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Warehouse</Label>
                                <Select value={editForm.data.warehouse_id} onValueChange={v => editForm.setData('warehouse_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map(w => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status *</Label>
                                <Select value={editForm.data.status} onValueChange={v => editForm.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SERIAL_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {renderAttributesForm(editForm, 'edit')}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingSerial(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>{editForm.processing ? 'Saving...' : 'Update'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={!!pendingDeleteSerial}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDeleteSerial(null);
                    }
                }}
                title="Delete serial"
                description={pendingDeleteSerial
                    ? `Are you sure you want to delete serial "${pendingDeleteSerial.serial_number}"? This action cannot be undone.`
                    : 'Are you sure you want to delete this serial?'}
                confirmLabel="Delete"
                confirmVariant="destructive"
                onConfirm={confirmDeleteSerial}
            />

            <Dialog open={!!attributesPreviewSerial} onOpenChange={() => setAttributesPreviewSerial(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Serial attributes</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 text-sm">
                        {(attributesPreviewSerial?.attribute_values ?? []).length === 0 && (
                            <p className="text-muted-foreground">No attributes assigned.</p>
                        )}
                        {(attributesPreviewSerial?.attribute_values ?? []).map((item) => (
                            <div key={item.id} className="rounded-md border px-3 py-2">
                                <p className="font-medium">{item.attribute?.name}</p>
                                <p className="text-muted-foreground">{item.attribute_option?.label ?? item.attribute_option?.value ?? '—'}</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductSerials.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventory', href: '#' },
        { title: 'Products', href: productsIndex() },
        { title: 'Serials', href: '#' },
    ]}>
        {page}
    </AppLayout>
);
