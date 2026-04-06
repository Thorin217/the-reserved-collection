import { Head, Link, router } from '@inertiajs/react';
import { Edit, ListChecks, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import * as ProductSerialController from '@/actions/App/Http/Controllers/Admin/ProductSerialController';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { create as createProduct, index as productsIndex } from '@/routes/admin/products';
import type { Brand, Category, PaginatedData, Product } from '@/types';

const ALL = '_all';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    active: { label: 'Activo', variant: 'default' },
    draft: { label: 'Borrador', variant: 'secondary' },
    inactive: { label: 'Inactivo', variant: 'outline' },
};

const TYPE_LABELS: Record<string, string> = {
    simple: 'Simple',
    variant: 'Con variantes',
    serializable: 'Con seriales',
};

type Props = {
    products: PaginatedData<Product>;
    brands: { data: Brand[] };
    categories: { data: Category[] };
    filters: { search?: string; status?: string; brand_id?: string; category_id?: string };
};

export default function ProductsIndex({ products, brands, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(productsIndex(), { ...filters, [key]: resolved }, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    function deleteProduct(product: Product) {
        if (!confirm(`¿Eliminar producto "${product.name}"?`)) { return; }
        router.delete(ProductController.destroy.url(product));
    }

    return (
        <>
            <Head title="Productos" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Productos</h1>
                        <p className="text-sm text-muted-foreground">{products.meta.total} productos en inventario</p>
                    </div>
                    <Button asChild size="sm">
                        <Link href={createProduct()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo producto
                        </Link>
                    </Button>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Buscar por nombre o SKU..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-64"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                    <Select value={filters.status ?? ALL} onValueChange={v => applyFilter('status', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Todos</SelectItem>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="draft">Borrador</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.brand_id ?? ALL} onValueChange={v => applyFilter('brand_id', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Marca" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Todas las marcas</SelectItem>
                            {brands.data.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.category_id ?? ALL} onValueChange={v => applyFilter('category_id', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Categoría" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Todas las categorías</SelectItem>
                            {categories.data.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Producto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Marca</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-center">Tipo</TableHead>
                                    <TableHead className="text-center">Variantes</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
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
                                                        <Button variant="ghost" size="icon" asChild title="Seriales">
                                                            <Link href={ProductSerialController.index.url(product)}>
                                                                <ListChecks className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" asChild title="Editar">
                                                        <Link href={ProductController.edit.url(product)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteProduct(product)} title="Eliminar">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {products.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No hay productos.{' '}
                                            <Link href={createProduct()} className="text-primary underline">Crear primer producto</Link>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {products.meta.last_page > 1 && (
                    <div className="flex justify-center gap-4">
                        {products.links.prev && <Link href={products.links.prev} className="text-sm text-primary underline">← Anterior</Link>}
                        <span className="text-sm text-muted-foreground">Página {products.meta.current_page} de {products.meta.last_page}</span>
                        {products.links.next && <Link href={products.links.next} className="text-sm text-primary underline">Siguiente →</Link>}
                    </div>
                )}
            </div>
        </>
    );
}

ProductsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventario', href: '#' }, { title: 'Productos', href: productsIndex() }]}>
        {page}
    </AppLayout>
);
