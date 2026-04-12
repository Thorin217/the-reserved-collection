import { Head, router, useForm } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as CategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    SearchableSelect,
} from '@/components/ui/searchable-select';
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
import { index as categoriesIndex } from '@/routes/admin/categories';
import type { Category, PaginatedData } from '@/types';

const NO_PARENT = '_none';
const ALL = '_all';

type Props = {
    categories: PaginatedData<Category>;
    parents: { data: Category[] };
    filters: {
        search?: string;
        status?: string;
        parent_id?: string;
    };
};

export default function CategoriesIndex({ categories, parents, filters }: Props) {
    const [editing, setEditing] = useState<Category | null>(null);
    const [creating, setCreating] = useState(false);
    const [pendingDeleteCategory, setPendingDeleteCategory] =
        useState<Category | null>(null);

    const storeForm = useForm({
        parent_id: NO_PARENT,
        name: '',
        description: '',
        is_active: true,
    });
    const editForm = useForm({
        parent_id: NO_PARENT,
        name: '',
        description: '',
        is_active: true,
    });

    const statusFilter = filters.status ?? ALL;
    const parentFilter = filters.parent_id ?? ALL;

    const statusOptions = [
        { value: ALL, label: 'All statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const parentFilterOptions = [
        { value: ALL, label: 'All parents' },
        { value: NO_PARENT, label: 'None (root)' },
        ...parents.data.map((parent) => ({
            value: parent.id.toString(),
            label: parent.name,
            keywords: parent.name,
        })),
    ];

    const parentFormOptions = [
        { value: NO_PARENT, label: 'None (root)' },
        ...parents.data.map((parent) => ({
            value: parent.id.toString(),
            label: parent.name,
            keywords: parent.name,
        })),
    ];

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
        const payload = {
            ...storeForm.data,
            parent_id:
                storeForm.data.parent_id === NO_PARENT
                    ? ''
                    : storeForm.data.parent_id,
        };
        storeForm.transform(() => payload);
        storeForm.post(CategoryController.store.url(), {
            onSuccess: () => {
                storeForm.reset();
                setCreating(false);
            },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();

        if (!editing) {
            return;
        }

        const payload = {
            ...editForm.data,
            parent_id:
                editForm.data.parent_id === NO_PARENT
                    ? ''
                    : editForm.data.parent_id,
        };
        editForm.transform(() => payload);
        editForm.put(CategoryController.update.url(editing), {
            onSuccess: () => {
                editForm.reset();
                setEditing(null);
            },
        });
    }

    function deleteCategory(category: Category) {
        router.delete(CategoryController.destroy.url(category));
    }

    function requestDeleteCategory(category: Category) {
        setPendingDeleteCategory(category);
    }

    function confirmDeleteCategory() {
        if (!pendingDeleteCategory) {
            return;
        }

        deleteCategory(pendingDeleteCategory);
        setPendingDeleteCategory(null);
    }

    function applyFilters(payload: Props['filters']) {
        router.get(categoriesIndex.url(), payload, {
            preserveState: true,
            replace: true,
        });
    }

    return (
        <>
            <Head title="Categories" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Categories</h1>
                        <p className="text-sm text-muted-foreground">
                            {categories.meta.total} categories registered
                        </p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New category
                    </Button>
                </div>

                <Card>
                    <CardContent className="grid gap-3 p-4 md:grid-cols-3">
                        <Input
                            placeholder="Search by name or description"
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
                            onValueChange={(value) => applyFilters({ ...filters, status: value === ALL ? '' : value })}
                            options={statusOptions}
                            placeholder="Status"
                            searchPlaceholder="Search status"
                        />

                        <SearchableSelect
                            value={parentFilter}
                            onValueChange={(value) => applyFilters({ ...filters, parent_id: value === ALL ? '' : value })}
                            options={parentFilterOptions}
                            placeholder="Parent"
                            searchPlaceholder="Search parent category"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Parent category</TableHead>
                                    <TableHead className="text-center">
                                        Products
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">
                                            {category.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {category.parent?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {category.products_count ?? 0}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    category.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {category.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                openEdit(
                                                                    category,
                                                                )
                                                            }
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Edit category
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                requestDeleteCategory(
                                                                    category,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Delete category
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {categories.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No categories.{' '}
                                            <button
                                                className="text-primary underline"
                                                onClick={openCreate}
                                            >
                                                Create first category
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                value={storeForm.data.name}
                                onChange={(e) =>
                                    storeForm.setData('name', e.target.value)
                                }
                                placeholder="Watches, Jewelry..."
                            />
                            <InputError message={storeForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label>Parent category</Label>
                            <SearchableSelect
                                value={storeForm.data.parent_id}
                                onValueChange={(v) =>
                                    storeForm.setData('parent_id', v)
                                }
                                options={parentFormOptions}
                                placeholder="None (root)"
                                searchPlaceholder="Search parent category"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={storeForm.data.description}
                                onChange={(e) =>
                                    storeForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                            />
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
                                disabled={storeForm.processing}
                            >
                                {storeForm.processing ? 'Saving...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData('name', e.target.value)
                                }
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label>Parent category</Label>
                            <SearchableSelect
                                value={editForm.data.parent_id}
                                onValueChange={(v) =>
                                    editForm.setData('parent_id', v)
                                }
                                options={parentFormOptions}
                                placeholder="None (root)"
                                searchPlaceholder="Search parent category"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={editForm.data.description}
                                onChange={(e) =>
                                    editForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                            />
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
                                {editForm.processing ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={!!pendingDeleteCategory}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDeleteCategory(null);
                    }
                }}
                title="Delete category"
                description={pendingDeleteCategory
                    ? `Are you sure you want to delete "${pendingDeleteCategory.name}"? This action cannot be undone.`
                    : 'Are you sure you want to delete this category?'}
                confirmLabel="Delete"
                confirmVariant="destructive"
                onConfirm={confirmDeleteCategory}
            />
        </>
    );
}

CategoriesIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Categories', href: categoriesIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
