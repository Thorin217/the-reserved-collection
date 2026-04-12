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
    const initialVariants =
        product.variants && product.variants.length > 0
            ? product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                cost: variant.cost ?? '',
                price: variant.price ?? '',
                compare_price: variant.compare_price ?? '',
            }))
            : [
                {
                    sku: '',
                    cost: '',
                    price: '',
                    compare_price: '',
                },
            ];

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
        image: null as File | null,
        variants: initialVariants,
    });

    const formErrors = errors as Record<string, string | undefined>;

    function addVariant(): void {
        setData('variants', [
            ...data.variants,
            {
                sku: '',
                cost: '',
                price: '',
                compare_price: '',
            },
        ]);
    }

    function removeVariant(index: number): void {
        const updatedVariants = data.variants.filter((_, idx) => idx !== index);

        setData(
            'variants',
            updatedVariants.length > 0
                ? updatedVariants
                : [
                    {
                        sku: '',
                        cost: '',
                        price: '',
                        compare_price: '',
                    },
                ],
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(ProductController.update.url(product), {
            forceFormData: true,
        });
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
                                        placeholder="Product description..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Variants</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addVariant}
                                    >
                                        Add variant
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.variants.map((variant, index) => (
                                    <div
                                        key={`variant-${index}`}
                                        className="space-y-4 rounded-md border p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                Variant {index + 1}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeVariant(index)}
                                                disabled={data.variants.length === 1}
                                            >
                                                Remove
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`variant-sku-${index}`}>
                                                Variant SKU *
                                            </Label>
                                            <Input
                                                id={`variant-sku-${index}`}
                                                value={variant.sku}
                                                onChange={(e) => {
                                                    const nextVariants = [...data.variants];
                                                    nextVariants[index] = {
                                                        ...nextVariants[index],
                                                        sku: e.target.value,
                                                    };
                                                    setData('variants', nextVariants);
                                                }}
                                                placeholder="ROL-001-VAR"
                                                className="font-mono"
                                            />
                                            <InputError
                                                message={
                                                    formErrors[`variants.${index}.sku`]
                                                }
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`cost-${index}`}>
                                                    Cost (USD)
                                                </Label>
                                                <Input
                                                    id={`cost-${index}`}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={variant.cost ?? ''}
                                                    onChange={(e) => {
                                                        const nextVariants = [
                                                            ...data.variants,
                                                        ];
                                                        nextVariants[index] = {
                                                            ...nextVariants[index],
                                                            cost: e.target.value,
                                                        };
                                                        setData('variants', nextVariants);
                                                    }}
                                                    placeholder="0.00"
                                                />
                                                <InputError
                                                    message={
                                                        formErrors[`variants.${index}.cost`]
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`price-${index}`}>
                                                    Sale price (USD)
                                                </Label>
                                                <Input
                                                    id={`price-${index}`}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={variant.price ?? ''}
                                                    onChange={(e) => {
                                                        const nextVariants = [
                                                            ...data.variants,
                                                        ];
                                                        nextVariants[index] = {
                                                            ...nextVariants[index],
                                                            price: e.target.value,
                                                        };
                                                        setData('variants', nextVariants);
                                                    }}
                                                    placeholder="0.00"
                                                />
                                                <InputError
                                                    message={
                                                        formErrors[`variants.${index}.price`]
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`compare-price-${index}`}>
                                                    Compare price
                                                </Label>
                                                <Input
                                                    id={`compare-price-${index}`}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={variant.compare_price ?? ''}
                                                    onChange={(e) => {
                                                        const nextVariants = [
                                                            ...data.variants,
                                                        ];
                                                        nextVariants[index] = {
                                                            ...nextVariants[index],
                                                            compare_price:
                                                                e.target.value,
                                                        };
                                                        setData('variants', nextVariants);
                                                    }}
                                                    placeholder="0.00"
                                                />
                                                <InputError
                                                    message={
                                                        formErrors[
                                                            `variants.${index}.compare_price`
                                                        ]
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <InputError message={formErrors.variants} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Image</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-36 w-full rounded-md border object-cover"
                                    />
                                ) : (
                                    <div className="flex h-36 w-full items-center justify-center rounded-md border text-xs text-muted-foreground">
                                        No image uploaded
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="image">Replace image</Label>
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('image', e.target.files?.[0] ?? null)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG or WEBP up to 5MB.
                                    </p>
                                    {data.image && (
                                        <p className="text-xs text-foreground">
                                            Selected: {data.image.name}
                                        </p>
                                    )}
                                    <InputError message={errors.image} />
                                </div>
                            </CardContent>
                        </Card>

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
