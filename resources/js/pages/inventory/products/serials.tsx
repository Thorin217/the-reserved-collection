import { Head, Link, router, useForm } from '@inertiajs/react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import * as ProductSerialController from '@/actions/App/Http/Controllers/Admin/ProductSerialController';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndex } from '@/routes/admin/products';
import type { InventoryMovement, PaginatedData, Product, ProductSerial, ProductVariant, Warehouse } from '@/types';

const SERIAL_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    available: { label: 'Disponible', variant: 'default' },
    reserved: { label: 'Reservado', variant: 'secondary' },
    sold: { label: 'Vendido', variant: 'outline' },
    returned: { label: 'Retornado', variant: 'secondary' },
    damaged: { label: 'Dañado', variant: 'destructive' },
    in_transit: { label: 'En tránsito', variant: 'secondary' },
};

type Props = {
    product: { data: Product };
    serials: PaginatedData<ProductSerial>;
    movements: { data: InventoryMovement[] };
    warehouses: { data: Warehouse[] };
};

export default function ProductSerials({ product: { data: product }, serials, movements, warehouses }: Props) {
    const [addingSerial, setAddingSerial] = useState(false);
    const [editingSerial, setEditingSerial] = useState<ProductSerial | null>(null);

    const firstVariant = product.variants?.[0];

    const storeForm = useForm({
        product_variant_id: firstVariant?.id.toString() ?? '',
        serial_number: '',
        imei_or_reference: '',
        warehouse_id: '',
        status: 'available',
    });

    const editForm = useForm({
        serial_number: '',
        imei_or_reference: '',
        warehouse_id: '',
        status: 'available',
    });

    function openAdd() {
        storeForm.reset();
        storeForm.setData('product_variant_id', firstVariant?.id.toString() ?? '');
        storeForm.setData('status', 'available');
        setAddingSerial(true);
    }

    function openEdit(serial: ProductSerial) {
        editForm.setData({
            serial_number: serial.serial_number,
            imei_or_reference: serial.imei_or_reference ?? '',
            warehouse_id: serial.warehouse_id?.toString() ?? '',
            status: serial.status,
        });
        setEditingSerial(serial);
    }

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        storeForm.post(ProductSerialController.store.url(product), {
            onSuccess: () => { storeForm.reset(); setAddingSerial(false); },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingSerial) { return; }
        editForm.put(ProductSerialController.update.url({ product, serial: editingSerial }), {
            onSuccess: () => { editForm.reset(); setEditingSerial(null); },
        });
    }

    function deleteSerial(serial: ProductSerial) {
        if (!confirm(`¿Eliminar serial "${serial.serial_number}"?`)) { return; }
        router.delete(ProductSerialController.destroy.url({ product, serial }));
    }

    const serialCounts = {
        available: serials.data.filter(s => s.status === 'available').length,
        sold: serials.data.filter(s => s.status === 'sold').length,
        reserved: serials.data.filter(s => s.status === 'reserved').length,
    };

    return (
        <>
            <Head title={`Seriales – ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={ProductController.edit.url(product)} className="text-muted-foreground hover:text-foreground text-sm">
                                ← {product.name}
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold">Seriales / Trazabilidad</h1>
                        <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                    </div>
                    <Button onClick={openAdd} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar serial
                    </Button>
                </div>

                {/* Resumen */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-3xl font-bold text-green-600">{serialCounts.available}</p>
                            <p className="text-sm text-muted-foreground">Disponibles</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-3xl font-bold text-yellow-600">{serialCounts.reserved}</p>
                            <p className="text-sm text-muted-foreground">Reservados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-3xl font-bold text-muted-foreground">{serialCounts.sold}</p>
                            <p className="text-sm text-muted-foreground">Vendidos</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Tabla de seriales */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Unidades registradas ({serials.meta.total})</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-2 text-left font-medium">Serial</th>
                                            <th className="px-4 py-2 text-left font-medium">Referencia</th>
                                            <th className="px-4 py-2 text-left font-medium">Bodega</th>
                                            <th className="px-4 py-2 text-center font-medium">Estado</th>
                                            <th className="px-4 py-2 text-right font-medium">Acciones</th>
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
                                                    <td className="px-4 py-2 text-center">
                                                        <Badge variant={s.variant}>{s.label}</Badge>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="sm" onClick={() => openEdit(serial)}>
                                                                Editar
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteSerial(serial)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {serials.data.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                    No hay seriales. <button className="text-primary underline" onClick={openAdd}>Registrar primer serial</button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Historial de movimientos */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Historial reciente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {movements.data.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">Sin movimientos registrados</p>
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
                                                {new Date(movement.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal: Agregar serial */}
            <Dialog open={addingSerial} onOpenChange={setAddingSerial}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Registrar serial</DialogTitle></DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-4">
                        {product.variants && product.variants.length > 1 && (
                            <div className="space-y-2">
                                <Label>Variante</Label>
                                <Select value={storeForm.data.product_variant_id} onValueChange={v => storeForm.setData('product_variant_id', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {product.variants.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.sku}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Número de serial *</Label>
                            <Input value={storeForm.data.serial_number} onChange={e => storeForm.setData('serial_number', e.target.value)} placeholder="SN-XXXXX" className="font-mono" />
                            <InputError message={storeForm.errors.serial_number} />
                        </div>
                        <div className="space-y-2">
                            <Label>IMEI / Referencia</Label>
                            <Input value={storeForm.data.imei_or_reference} onChange={e => storeForm.setData('imei_or_reference', e.target.value)} placeholder="REF-XXXXX" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Bodega</Label>
                                <Select value={storeForm.data.warehouse_id} onValueChange={v => storeForm.setData('warehouse_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map(w => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={storeForm.data.status} onValueChange={v => storeForm.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SERIAL_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddingSerial(false)}>Cancelar</Button>
                            <Button type="submit" disabled={storeForm.processing}>{storeForm.processing ? 'Guardando...' : 'Registrar'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Editar serial */}
            <Dialog open={!!editingSerial} onOpenChange={() => setEditingSerial(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Actualizar serial</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Número de serial</Label>
                            <Input value={editForm.data.serial_number} onChange={e => editForm.setData('serial_number', e.target.value)} className="font-mono" />
                            <InputError message={editForm.errors.serial_number} />
                        </div>
                        <div className="space-y-2">
                            <Label>IMEI / Referencia</Label>
                            <Input value={editForm.data.imei_or_reference} onChange={e => editForm.setData('imei_or_reference', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Bodega</Label>
                                <Select value={editForm.data.warehouse_id} onValueChange={v => editForm.setData('warehouse_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.data.map(w => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Estado *</Label>
                                <Select value={editForm.data.status} onValueChange={v => editForm.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SERIAL_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingSerial(null)}>Cancelar</Button>
                            <Button type="submit" disabled={editForm.processing}>{editForm.processing ? 'Guardando...' : 'Actualizar'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductSerials.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventario', href: '#' },
        { title: 'Productos', href: productsIndex() },
        { title: 'Seriales', href: '#' },
    ]}>
        {page}
    </AppLayout>
);
