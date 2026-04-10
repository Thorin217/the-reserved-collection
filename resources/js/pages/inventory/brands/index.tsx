import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as BrandController from '@/actions/App/Http/Controllers/Admin/BrandController';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { index as brandsIndex } from '@/routes/admin/brands';
import type { Brand, PaginatedData } from '@/types';

type Props = {
    brands: PaginatedData<Brand>;
};

export default function BrandsIndex({ brands }: Props) {
    const [editing, setEditing] = useState<Brand | null>(null);
    const [creating, setCreating] = useState(false);
    const [pendingDeleteBrand, setPendingDeleteBrand] = useState<Brand | null>(null);

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
            onSuccess: () => {
 storeForm.reset(); setCreating(false);
},
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();

        if (!editing) {
 return;
}

        editForm.put(BrandController.update.url(editing), {
            onSuccess: () => {
 editForm.reset(); setEditing(null);
},
        });
    }

    function deleteBrand(brand: Brand) {
        router.delete(BrandController.destroy.url(brand));
    }

    function requestDeleteBrand(brand: Brand) {
        setPendingDeleteBrand(brand);
    }

    function confirmDeleteBrand() {
        if (!pendingDeleteBrand) {
            return;
        }

        deleteBrand(pendingDeleteBrand);
        setPendingDeleteBrand(null);
    }

    return (
        <>
            <Head title="Brands" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Brands</h1>
                        <p className="text-sm text-muted-foreground">{brands.meta.total} brands registered</p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New brand
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Products</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
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
                                                {brand.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit brand</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => requestDeleteBrand(brand)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete brand</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {brands.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                            No brands registered.{' '}
                                            <button className="text-primary underline" onClick={openCreate}>Create first brand</button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {brands.meta.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {brands.links.prev && <Link href={brands.links.prev} className="text-sm text-primary underline">← Previous</Link>}
                        <span className="text-sm text-muted-foreground">Page {brands.meta.current_page} of {brands.meta.last_page}</span>
                        {brands.links.next && <Link href={brands.links.next} className="text-sm text-primary underline">Next →</Link>}
                    </div>
                )}
            </div>

            <ConfirmationModal
                open={!!pendingDeleteBrand}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDeleteBrand(null);
                    }
                }}
                title="Delete brand"
                description={pendingDeleteBrand
                    ? `Are you sure you want to delete "${pendingDeleteBrand.name}"? This action cannot be undone.`
                    : 'Are you sure you want to delete this brand?'}
                confirmLabel="Delete"
                confirmVariant="destructive"
                onConfirm={confirmDeleteBrand}
            />

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New brand</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Name *</Label>
                            <Input id="create-name" value={storeForm.data.name} onChange={e => storeForm.setData('name', e.target.value)} placeholder="Rolex, Cartier..." />
                            <InputError message={storeForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-desc">Description</Label>
                            <Input id="create-desc" value={storeForm.data.description} onChange={e => storeForm.setData('description', e.target.value)} placeholder="Optional description" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                            <Button type="submit" disabled={storeForm.processing}>
                                {storeForm.processing ? 'Saving...' : 'Create brand'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit brand</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name *</Label>
                            <Input id="edit-name" value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-desc">Description</Label>
                            <Input id="edit-desc" value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Saving...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

BrandsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventory', href: '#' }, { title: 'Brands', href: brandsIndex() }]}>
        {page}
    </AppLayout>
);
