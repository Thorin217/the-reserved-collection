import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as CategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as categoriesIndex } from '@/routes/admin/categories';
import type { Category, PaginatedData } from '@/types';

const NO_PARENT = '_none';

type Props = {
    categories: PaginatedData<Category>;
    parents: { data: Category[] };
};

export default function CategoriesIndex({ categories, parents }: Props) {
    const [editing, setEditing] = useState<Category | null>(null);
    const [creating, setCreating] = useState(false);

    const storeForm = useForm({ parent_id: NO_PARENT, name: '', description: '', is_active: true });
    const editForm = useForm({ parent_id: NO_PARENT, name: '', description: '', is_active: true });

    function openCreate() {
        storeForm.reset();
        setCreating(true);
    }

    function openEdit(category: Category) {
        editForm.setData({
            parent_id: category.parent_id?.toString() ?? NO_PARENT,
            name: category.name,
            description: category.description ?? '',
            is_active: category.is_active,
        });
        setEditing(category);
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        const payload = { ...storeForm.data, parent_id: storeForm.data.parent_id === NO_PARENT ? '' : storeForm.data.parent_id };
        storeForm.transform(() => payload).post(CategoryController.store.url(), {
            onSuccess: () => { storeForm.reset(); setCreating(false); },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) { return; }
        const payload = { ...editForm.data, parent_id: editForm.data.parent_id === NO_PARENT ? '' : editForm.data.parent_id };
        editForm.transform(() => payload).put(CategoryController.update.url(editing), {
            onSuccess: () => { editForm.reset(); setEditing(null); },
        });
    }

    function deleteCategory(category: Category) {
        if (!confirm(`¿Eliminar categoría "${category.name}"?`)) { return; }
        router.delete(CategoryController.destroy.url(category));
    }

    return (
        <>
            <Head title="Categorías" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Categorías</h1>
                        <p className="text-sm text-muted-foreground">{categories.meta.total} categorías registradas</p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva categoría
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Categoría padre</TableHead>
                                    <TableHead className="text-center">Productos</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{category.parent?.name ?? '—'}</TableCell>
                                        <TableCell className="text-center">{category.products_count ?? 0}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                {category.is_active ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteCategory(category)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {categories.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                            No hay categorías.{' '}
                                            <button className="text-primary underline" onClick={openCreate}>Crear primera categoría</button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal: Crear */}
            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre *</Label>
                            <Input value={storeForm.data.name} onChange={e => storeForm.setData('name', e.target.value)} placeholder="Relojes, Joyería..." />
                            <InputError message={storeForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoría padre</Label>
                            <Select value={storeForm.data.parent_id} onValueChange={v => storeForm.setData('parent_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Ninguna (raíz)" /></SelectTrigger>
                                                                <SelectContent>
                                    <SelectItem value={NO_PARENT}>Ninguna (raíz)</SelectItem>
                                    {parents.data.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input value={storeForm.data.description} onChange={e => storeForm.setData('description', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
                            <Button type="submit" disabled={storeForm.processing}>{storeForm.processing ? 'Guardando...' : 'Crear'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Editar */}
            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar categoría</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre *</Label>
                            <Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoría padre</Label>
                            <Select value={editForm.data.parent_id} onValueChange={v => editForm.setData('parent_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Ninguna (raíz)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_PARENT}>Ninguna (raíz)</SelectItem>
                                    {parents.data.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                            <Button type="submit" disabled={editForm.processing}>{editForm.processing ? 'Guardando...' : 'Guardar'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

CategoriesIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventario', href: '#' }, { title: 'Categorías', href: categoriesIndex() }]}>
        {page}
    </AppLayout>
);
