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
            <Head title="Nuevo producto" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Nuevo producto</h1>
                    <p className="text-sm text-muted-foreground">Completa los datos del producto y su variante principal</p>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    {/* Información general */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre *</Label>
                                    <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Nombre del producto" />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Marca *</Label>
                                        <Select value={data.brand_id} onValueChange={v => setData('brand_id', v)}>
                                            <SelectTrigger id="brand"><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                                            <SelectContent>
                                                {brands.data.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.brand_id} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categoría *</Label>
                                        <Select value={data.category_id} onValueChange={v => setData('category_id', v)}>
                                            <SelectTrigger id="category"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
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
                                    <Label htmlFor="description">Descripción</Label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Descripción del producto..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Variante principal */}
                        <Card>
                            <CardHeader><CardTitle>Variante principal</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="variant-sku">SKU variante *</Label>
                                    <Input id="variant-sku" value={data['variant[sku]']} onChange={e => setData('variant[sku]', e.target.value)} placeholder="ROL-001-VAR" className="font-mono" />
                                    <InputError message={errors['variant[sku]']} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cost">Costo (USD)</Label>
                                        <Input id="cost" type="number" step="0.01" min="0" value={data['variant[cost]']} onChange={e => setData('variant[cost]', e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Precio venta (USD) *</Label>
                                        <Input id="price" type="number" step="0.01" min="0" value={data['variant[price]']} onChange={e => setData('variant[price]', e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="compare-price">Precio comparación</Label>
                                        <Input id="compare-price" type="number" step="0.01" min="0" value={data['variant[compare_price]']} onChange={e => setData('variant[compare_price]', e.target.value)} placeholder="0.00" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Panel derecho */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Estado y tipo</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Select value={data.status} onValueChange={v => setData('status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Borrador</SelectItem>
                                            <SelectItem value="active">Activo</SelectItem>
                                            <SelectItem value="inactive">Inactivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de producto</Label>
                                    <Select value={data.product_type} onValueChange={v => {
                                        setData('product_type', v);
                                        setData('has_serial_numbers', v === 'serializable');
                                    }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="simple">Simple</SelectItem>
                                            <SelectItem value="variant">Con variantes</SelectItem>
                                            <SelectItem value="serializable">Con seriales (relojes/joyas)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.product_type} />
                                </div>
                                {data.product_type === 'serializable' && (
                                    <p className="text-xs text-muted-foreground">
                                        Cada unidad tendrá un número de serie único para trazabilidad completa.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => history.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing}>
                                {processing ? 'Guardando...' : 'Crear producto'}
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
        { title: 'Inventario', href: '#' },
        { title: 'Productos', href: productsIndex() },
        { title: 'Nuevo', href: createRoute() },
    ]}>
        {page}
    </AppLayout>
);
