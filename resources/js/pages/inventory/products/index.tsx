import { Head, Link, router } from '@inertiajs/react';
import { Edit, ListChecks, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import * as ProductSerialController from '@/actions/App/Http/Controllers/Admin/ProductSerialController';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { create as createProduct, index as productsIndex } from '@/routes/admin/products';
import type { Brand, Category, PaginatedData, Product } from '@/types';

const ALL = '_all';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    draft: { label: 'Draft', variant: 'secondary' },
    inactive: { label: 'Inactive', variant: 'outline' },
};

const TYPE_LABELS: Record<string, string> = {
    simple: 'Simple',
    variant: 'With variants',
    serializable: 'With serials',
};

type Props = {
    products: PaginatedData<Product>;
    brands: { data: Brand[] };
    categories: { data: Category[] };
    filters: { search?: string; status?: string; brand_id?: string; category_id?: string };
};

export default function ProductsIndex({ products, brands, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(productsIndex(), { ...filters, [key]: resolved }, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    function deleteProduct(product: Product) {
        router.delete(ProductController.destroy.url(product));
    }

    function requestDeleteProduct(product: Product) {
        setPendingDeleteProduct(product);
    }

    function confirmDeleteProduct() {
        if (!pendingDeleteProduct) {
            return;
        }

        deleteProduct(pendingDeleteProduct);
        setPendingDeleteProduct(null);
    }

    return (
        <>
            <Head title="Products" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Products</h1>
                        <p className="text-sm text-muted-foreground">{products.meta.total} products in inventory</p>
                    </div>
                    <Button asChild size="sm">
                        <Link href={createProduct()}>
                            <Plus className="mr-2 h-4 w-4" />
                            New product
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by name or SKU..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-64"
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="submit" variant="outline" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Search products</TooltipContent>
                        </Tooltip>
                    </form>
                    <Select value={filters.status ?? ALL} onValueChange={v => applyFilter('status', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.brand_id ?? ALL} onValueChange={v => applyFilter('brand_id', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Brand" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All brands</SelectItem>
                            {brands.data.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.category_id ?? ALL} onValueChange={v => applyFilter('category_id', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All categories</SelectItem>
                            {categories.data.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-center">Type</TableHead>
                                    <TableHead className="text-center">Variants</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.map((product) => {
                                    const status = STATUS_LABELS[product.status] ?? STATUS_LABELS.draft;
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                                            <TableCell>{product.brand?.name ?? '—'}</TableCell>
                                            <TableCell>{product.category?.name ?? '—'}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-xs">{TYPE_LABELS[product.product_type]}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{product.variants_count ?? 0}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    {product.has_serial_numbers && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" asChild>
                                                                    <Link href={ProductSerialController.index.url(product)}>
                                                                        <ListChecks className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>View serials</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <Link href={ProductController.edit.url(product)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit product</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => requestDeleteProduct(product)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete product</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {products.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No products.{' '}
                                            <Link href={createProduct()} className="text-primary underline">Create first product</Link>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {products.meta.last_page > 1 && (
                    <div className="flex justify-center gap-4">
                        {products.links.prev && <Link href={products.links.prev} className="text-sm text-primary underline">← Previous</Link>}
                        <span className="text-sm text-muted-foreground">Page {products.meta.current_page} of {products.meta.last_page}</span>
                        {products.links.next && <Link href={products.links.next} className="text-sm text-primary underline">Next →</Link>}
                    </div>
                )}
            </div>

            <ConfirmationModal
                open={!!pendingDeleteProduct}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDeleteProduct(null);
                    }
                }}
                title="Delete product"
                description={pendingDeleteProduct
                    ? `Are you sure you want to delete "${pendingDeleteProduct.name}"? This action cannot be undone.`
                    : ''}
                confirmLabel="Delete product"
                confirmVariant="destructive"
                onConfirm={confirmDeleteProduct}
            />
        </>
    );
}

ProductsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventory', href: '#' }, { title: 'Products', href: productsIndex() }]}>
        {page}
    </AppLayout>
);
