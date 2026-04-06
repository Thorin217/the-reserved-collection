import { Head, useForm } from '@inertiajs/react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { create as createRoute, index as productsIndex } from '@/routes/admin/products';
import type { Brand, Category } from '@/types';

type Props = {
    brands: { data: Brand[] };
    categories: { data: Category[] };
};

type FormData = {
    category_id: string;
    brand_id: string;
    name: string;
    sku: string;
    description: string;
    product_type: string;
    track_stock: boolean;
    has_serial_numbers: boolean;
    status: string;
    'variant[sku]': string;
    'variant[cost]': string;
    'variant[price]': string;
    'variant[compare_price]': string;
};

export default function ProductCreate({ brands, categories }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        category_id: '',
        brand_id: '',
        name: '',
        sku: '',
        description: '',
        product_type: 'serializable',
        track_stock: true,
        has_serial_numbers: true,
        status: 'draft',
        'variant[sku]': '',
        'variant[cost]': '',
        'variant[price]': '',
        'variant[compare_price]': '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(ProductController.store.url());
    }

    return (
        <>
            <Head title="New product" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">New product</h1>
                    <p className="text-sm text-muted-foreground">Fill in the product details and its main variant</p>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader><CardTitle>General information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Product name" />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Brand *</Label>
                                        <Select value={data.brand_id} onValueChange={v => setData('brand_id', v)}>
                                            <SelectTrigger id="brand"><SelectValue placeholder="Select brand" /></SelectTrigger>
                                            <SelectContent>
                                                {brands.data.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.brand_id} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category *</Label>
                                        <Select value={data.category_id} onValueChange={v => setData('category_id', v)}>
                                            <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                                            <SelectContent>
                                                {categories.data.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.category_id} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input id="sku" value={data.sku} onChange={e => setData('sku', e.target.value)} placeholder="ROL-001" className="font-mono" />
                                    <InputError message={errors.sku} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Product description..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Main variant</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="variant-sku">Variant SKU *</Label>
                                    <Input id="variant-sku" value={data['variant[sku]']} onChange={e => setData('variant[sku]', e.target.value)} placeholder="ROL-001-VAR" className="font-mono" />
                                    <InputError message={errors['variant[sku]']} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cost">Cost (USD)</Label>
                                        <Input id="cost" type="number" step="0.01" min="0" value={data['variant[cost]']} onChange={e => setData('variant[cost]', e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Sale price (USD) *</Label>
                                        <Input id="price" type="number" step="0.01" min="0" value={data['variant[price]']} onChange={e => setData('variant[price]', e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="compare-price">Compare price</Label>
                                        <Input id="compare-price" type="number" step="0.01" min="0" value={data['variant[compare_price]']} onChange={e => setData('variant[compare_price]', e.target.value)} placeholder="0.00" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                                    <Select value={data.product_type} onValueChange={v => {
                                        setData('product_type', v);
                                        setData('has_serial_numbers', v === 'serializable');
                                    }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="simple">Simple</SelectItem>
                                            <SelectItem value="variant">With variants</SelectItem>
                                            <SelectItem value="serializable">With serials (watches/jewelry)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.product_type} />
                                </div>
                                {data.product_type === 'serializable' && (
                                    <p className="text-xs text-muted-foreground">
                                        Each unit will have a unique serial number for full traceability.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing}>
                                {processing ? 'Saving...' : 'Create product'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

ProductCreate.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Inventory', href: '#' },
        { title: 'Products', href: productsIndex() },
        { title: 'New', href: createRoute() },
    ]}>
        {page}
    </AppLayout>
);
