import { Head, useForm } from '@inertiajs/react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndex } from '@/routes/admin/products';
import type { Brand, Category, Product } from '@/types';

type Props = {
    product: { data: Product };
    brands: { data: Brand[] };
    categories: { data: Category[] };
};

export default function ProductEdit({ product: { data: product }, brands, categories }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        category_id: product.category_id.toString(),
        brand_id: product.brand_id.toString(),
        name: product.name,
        sku: product.sku,
        description: product.description ?? '',
        product_type: product.product_type,
        track_stock: product.track_stock,
        has_serial_numbers: product.has_serial_numbers,
        status: product.status,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(ProductController.update.url(product));
    }

    return (
        <>
            <Head title={`Edit: ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Edit product</h1>
                    <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader><CardTitle>General information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Brand *</Label>
                                        <Select value={data.brand_id} onValueChange={v => setData('brand_id', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {brands.data.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.brand_id} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category *</Label>
                                        <Select value={data.category_id} onValueChange={v => setData('category_id', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {categories.data.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.category_id} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input id="sku" value={data.sku} onChange={e => setData('sku', e.target.value)} className="font-mono" />
                                    <InputError message={errors.sku} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {product.variants && product.variants.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle>Variants ({product.variants.length})</CardTitle></CardHeader>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="px-4 py-2 text-left font-medium">SKU</th>
                                                <th className="px-4 py-2 text-right font-medium">Cost</th>
                                                <th className="px-4 py-2 text-right font-medium">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {product.variants.map(v => (
                                                <tr key={v.id}>
                                                    <td className="px-4 py-2 font-mono text-xs">{v.sku}</td>
                                                    <td className="px-4 py-2 text-right">{v.cost ? `$${Number(v.cost).toLocaleString()}` : '—'}</td>
                                                    <td className="px-4 py-2 text-right">{v.price ? `$${Number(v.price).toLocaleString()}` : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Status & type</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={data.status} onValueChange={v => setData('status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Product type</Label>
                                    <Select value={data.product_type} onValueChange={v => setData('product_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="simple">Simple</SelectItem>
                                            <SelectItem value="variant">With variants</SelectItem>
                                            <SelectItem value="serializable">With serials</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing}>
                                {processing ? 'Saving...' : 'Save changes'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

ProductEdit.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventory', href: '#' },
        { title: 'Products', href: productsIndex() },
        { title: 'Edit', href: '#' },
    ]}>
        {page}
    </AppLayout>
);
