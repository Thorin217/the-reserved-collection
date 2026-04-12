import { Head, useForm } from '@inertiajs/react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import {
    create as createRoute,
    index as productsIndex,
} from '@/routes/admin/products';
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
    image: File | null;
    variants: Array<{
        sku: string;
        cost: string;
        price: string;
        compare_price: string;
    }>;
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
        image: null,
        variants: [
            {
                sku: '',
                cost: '',
                price: '',
                compare_price: '',
            },
        ],
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
        post(ProductController.store.url(), {
            forceFormData: true,
        });
    }

    return (
        <>
            <Head title="New product" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">New product</h1>
                    <p className="text-sm text-muted-foreground">
                        Fill in product details and register one or more variants
                    </p>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>General information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="Product name"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Brand *</Label>
                                        <Select
                                            value={data.brand_id}
                                            onValueChange={(v) =>
                                                setData('brand_id', v)
                                            }
                                        >
                                            <SelectTrigger id="brand">
                                                <SelectValue placeholder="Select brand" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {brands.data.map((b) => (
                                                    <SelectItem
                                                        key={b.id}
                                                        value={b.id.toString()}
                                                    >
                                                        {b.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.brand_id} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">
                                            Category *
                                        </Label>
                                        <Select
                                            value={data.category_id}
                                            onValueChange={(v) =>
                                                setData('category_id', v)
                                            }
                                        >
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.data.map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={c.id.toString()}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.category_id}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input
                                        id="sku"
                                        value={data.sku}
                                        onChange={(e) =>
                                            setData('sku', e.target.value)
                                        }
                                        placeholder="ROL-001"
                                        className="font-mono"
                                    />
                                    <InputError message={errors.sku} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                                                    value={variant.cost}
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
                                                    Sale price (USD) *
                                                </Label>
                                                <Input
                                                    id={`price-${index}`}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={variant.price}
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
                                                    value={variant.compare_price}
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
                            <CardHeader>
                                <CardTitle>Image</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="image">Product image</Label>
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setData(
                                                'image',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
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
                            <CardHeader>
                                <CardTitle>Status & type</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(v) =>
                                            setData('status', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">
                                                Draft
                                            </SelectItem>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Product type</Label>
                                    <Select
                                        value={data.product_type}
                                        onValueChange={(v) => {
                                            setData('product_type', v);
                                            setData(
                                                'has_serial_numbers',
                                                v === 'serializable',
                                            );
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="simple">
                                                Simple
                                            </SelectItem>
                                            <SelectItem value="variant">
                                                With variants
                                            </SelectItem>
                                            <SelectItem value="serializable">
                                                With serials (watches/jewelry)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.product_type} />
                                </div>
                                {data.product_type === 'serializable' && (
                                    <p className="text-xs text-muted-foreground">
                                        Each unit will have a unique serial
                                        number for full traceability.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => history.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={processing}
                            >
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
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Products', href: productsIndex() },
            { title: 'New', href: createRoute() },
        ]}
    >
        {page}
    </AppLayout>
);
