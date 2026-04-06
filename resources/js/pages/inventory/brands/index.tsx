import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as BrandController from '@/actions/App/Http/Controllers/Admin/BrandController';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as brandsIndex } from '@/routes/admin/brands';
import type { Brand, PaginatedData } from '@/types';

type Props = {
    brands: PaginatedData<Brand>;
};

export default function BrandsIndex({ brands }: Props) {
    const [editing, setEditing] = useState<Brand | null>(null);
    const [creating, setCreating] = useState(false);

    const storeForm = useForm({ name: '', description: '', is_active: true });
    const editForm = useForm({ name: '', description: '', is_active: true });

    function openCreate() {
        storeForm.reset();
        setCreating(true);
    }

    function openEdit(brand: Brand) {
        editForm.setData({ name: brand.name, description: brand.description ?? '', is_active: brand.is_active });
        setEditing(brand);
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        storeForm.post(BrandController.store.url(), {
            onSuccess: () => { storeForm.reset(); setCreating(false); },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) { return; }
        editForm.put(BrandController.update.url(editing), {
            onSuccess: () => { editForm.reset(); setEditing(null); },
        });
    }

    function deleteBrand(brand: Brand) {
        if (!confirm(`¿Eliminar marca "${brand.name}"? Esta acción no se puede deshacer.`)) { return; }
        router.delete(BrandController.destroy.url(brand));
    }

    return (
        <>
            <Head title="Marcas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Marcas</h1>
                        <p className="text-sm text-muted-foreground">{brands.meta.total} marcas registradas</p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva marca
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Marca</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-center">Productos</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {brands.data.map((brand) => (
                                    <TableRow key={brand.id}>
                                        <TableCell className="font-medium">{brand.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{brand.description ?? '—'}</TableCell>
                                        <TableCell className="text-center">{brand.products_count ?? 0}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                                                {brand.is_active ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteBrand(brand)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {brands.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                            No hay marcas registradas.{' '}
                                            <button className="text-primary underline" onClick={openCreate}>Crear primera marca</button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Paginación */}
                {brands.meta.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {brands.links.prev && <Link href={brands.links.prev} className="text-sm text-primary underline">← Anterior</Link>}
                        <span className="text-sm text-muted-foreground">Página {brands.meta.current_page} de {brands.meta.last_page}</span>
                        {brands.links.next && <Link href={brands.links.next} className="text-sm text-primary underline">Siguiente →</Link>}
                    </div>
                )}
            </div>

            {/* Modal: Crear */}
            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva marca</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Nombre *</Label>
                            <Input id="create-name" value={storeForm.data.name} onChange={e => storeForm.setData('name', e.target.value)} placeholder="Rolex, Cartier..." />
                            <InputError message={storeForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-desc">Descripción</Label>
                            <Input id="create-desc" value={storeForm.data.description} onChange={e => storeForm.setData('description', e.target.value)} placeholder="Descripción opcional" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
                            <Button type="submit" disabled={storeForm.processing}>
                                {storeForm.processing ? 'Guardando...' : 'Crear marca'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Editar */}
            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar marca</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre *</Label>
                            <Input id="edit-name" value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-desc">Descripción</Label>
                            <Input id="edit-desc" value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

BrandsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventario', href: '#' }, { title: 'Marcas', href: brandsIndex() }]}>
        {page}
    </AppLayout>
);
