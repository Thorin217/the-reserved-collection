import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
    attributes: {
        data: Array<{
            id: number;
            name: string;
            code: string;
            data_type: 'text' | 'textarea' | 'number' | 'decimal' | 'boolean' | 'date' | 'select';
            unit: string | null;
            is_required: boolean;
            is_filterable: boolean;
            attribute_options?: Array<{ id: number; value: string; label: string | null }>;
        }>;
    };
    variantAttributes: {
        data: Array<{
            id: number;
            name: string;
            code: string;
            data_type: 'text' | 'textarea' | 'number' | 'decimal' | 'boolean' | 'date' | 'select';
            unit: string | null;
            is_required: boolean;
            is_filterable: boolean;
            attribute_options?: Array<{ id: number; value: string; label: string | null }>;
        }>;
    };
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
    attributes: Array<{
        attribute_id: string;
        value: string;
        attribute_option_id: string;
    }>;
    variants: Array<{
        sku: string;
        cost: string;
        price: string;
        compare_price: string;
        attributes: Array<{
            attribute_id: string;
            attribute_option_id: string;
        }>;
    }>;
};

const MAX_VARIANT_ATTRIBUTES_PREVIEW = 3;

export default function ProductCreate({ brands, categories, attributes, variantAttributes }: Props) {
    const [activeVariantAttributesIndex, setActiveVariantAttributesIndex] = useState<number | null>(null);
    const initialAttributes: FormData['attributes'] = [];

    const { data, setData, transform, post, processing, errors } = useForm<FormData>({
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
        attributes: initialAttributes,
        variants: [
            {
                sku: '',
                cost: '',
                price: '',
                compare_price: '',
                attributes: [],
            },
        ],
    });

    const formErrors = errors as Record<string, string | undefined>;

    const attributesById = useMemo(
        () => new Map(attributes.data.map((attribute) => [attribute.id.toString(), attribute])),
        [attributes.data],
    );

    const attributeSelectorOptions = useMemo(
        () => attributes.data.map((attribute) => ({
            value: attribute.id.toString(),
            label: attribute.name,
            keywords: `${attribute.name} ${attribute.code}`,
        })),
        [attributes.data],
    );

    const completedRequiredCount = useMemo(
        () => data.attributes.filter((current) => {
            const attribute = attributesById.get(current.attribute_id);

            if (!attribute || !attribute.is_required) {
                return false;
            }

            if (attribute.data_type === 'select') {
                return Boolean(current.attribute_option_id);
            }

            return current.value.trim() !== '';
        }).length,
        [attributesById, data.attributes],
    );

    const requiredAttributeCount = useMemo(
        () => data.attributes.filter((current) => {
            const attribute = attributesById.get(current.attribute_id);

            return attribute?.is_required === true;
        }).length,
        [attributesById, data.attributes],
    );

    const filledAttributeCount = useMemo(
        () => data.attributes.filter((current) => {
            const attribute = attributesById.get(current.attribute_id);

            if (!attribute) {
                return false;
            }

            if (attribute.data_type === 'select') {
                return Boolean(current.attribute_option_id);
            }

            return current.value.trim() !== '';
        }).length,
        [attributesById, data.attributes],
    );

    function addVariant(): void {
        setData('variants', [
            ...data.variants,
            {
                sku: '',
                cost: '',
                price: '',
                compare_price: '',
                attributes: [],
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
                          attributes: [],
                      },
                  ],
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        transform((payload: FormData) => ({
            ...payload,
            attributes: payload.attributes.filter((attributeRow) => attributeRow.attribute_id !== ''),
            variants: payload.variants.map((variant) => ({
                ...variant,
                attributes: variant.attributes.filter((attributeRow) => attributeRow.attribute_id !== ''),
            })),
        }));

        post(ProductController.store.url(), {
            forceFormData: true,
        });
    }

    function addAttributeRow(): void {
        setData('attributes', [
            ...data.attributes,
            {
                attribute_id: '',
                value: '',
                attribute_option_id: '',
            },
        ]);
    }

    function removeAttributeRow(index: number): void {
        setData(
            'attributes',
            data.attributes.filter((_, attributeIndex) => attributeIndex !== index),
        );
    }

    function updateAttributeSelection(index: number, attributeId: string): void {
        const nextAttributes = [...data.attributes];
        nextAttributes[index] = {
            attribute_id: attributeId,
            value: '',
            attribute_option_id: '',
        };

        setData('attributes', nextAttributes);
    }

    function updateAttributeValue(index: number, field: 'value' | 'attribute_option_id', value: string): void {
        const nextAttributes = [...data.attributes];
        nextAttributes[index] = {
            ...nextAttributes[index],
            [field]: value,
        };
        setData('attributes', nextAttributes);
    }

    function clearAttributes(): void {
        setData('attributes', []);
    }

    function addVariantAttributeRow(variantIndex: number): void {
        const nextVariants = [...data.variants];
        nextVariants[variantIndex] = {
            ...nextVariants[variantIndex],
            attributes: [
                ...(nextVariants[variantIndex].attributes ?? []),
                { attribute_id: '', attribute_option_id: '' },
            ],
        };

        setData('variants', nextVariants);
    }

    function removeVariantAttributeRow(variantIndex: number, rowIndex: number): void {
        const nextVariants = [...data.variants];
        nextVariants[variantIndex] = {
            ...nextVariants[variantIndex],
            attributes: nextVariants[variantIndex].attributes.filter((_, itemIndex) => itemIndex !== rowIndex),
        };

        setData('variants', nextVariants);
    }

    function updateVariantAttributeSelection(variantIndex: number, rowIndex: number, attributeId: string): void {
        const nextVariants = [...data.variants];
        const nextAttributes = [...nextVariants[variantIndex].attributes];
        nextAttributes[rowIndex] = {
            attribute_id: attributeId,
            attribute_option_id: '',
        };

        nextVariants[variantIndex] = {
            ...nextVariants[variantIndex],
            attributes: nextAttributes,
        };

        setData('variants', nextVariants);
    }

    function updateVariantAttributeOption(variantIndex: number, rowIndex: number, optionId: string): void {
        const nextVariants = [...data.variants];
        const nextAttributes = [...nextVariants[variantIndex].attributes];
        nextAttributes[rowIndex] = {
            ...nextAttributes[rowIndex],
            attribute_option_id: optionId,
        };

        nextVariants[variantIndex] = {
            ...nextVariants[variantIndex],
            attributes: nextAttributes,
        };

        setData('variants', nextVariants);
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

                        {attributes.data.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <CardTitle>Attributes</CardTitle>
                                            <p className="text-xs text-muted-foreground">
                                                Filled: {filledAttributeCount}/{data.attributes.length} · Required:{' '}
                                                {completedRequiredCount}/{requiredAttributeCount}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" size="sm" variant="outline" onClick={clearAttributes}>
                                                Clear values
                                            </Button>
                                            <Button type="button" size="sm" variant="outline" onClick={addAttributeRow}>
                                                Add attribute
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {data.attributes.map((attributeRow, index) => {
                                        const fieldKey = `attributes.${index}`;
                                        const selectedAttribute = attributesById.get(attributeRow.attribute_id);
                                        const usedAttributeIds = data.attributes
                                            .filter((_, itemIndex) => itemIndex !== index)
                                            .map((item) => item.attribute_id)
                                            .filter((item) => item !== '');

                                        const attributeOptions = attributeSelectorOptions.filter(
                                            (option) => option.value === attributeRow.attribute_id || !usedAttributeIds.includes(option.value),
                                        );

                                        const optionList = (selectedAttribute?.attribute_options ?? []).map((option) => ({
                                            value: option.id.toString(),
                                            label: option.label ?? option.value,
                                            keywords: `${option.label ?? ''} ${option.value}`,
                                        }));

                                        return (
                                            <div key={`attribute-row-${index}`} className="space-y-2 rounded-md border p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Label>Attribute</Label>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => removeAttributeRow(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>

                                                <SearchableSelect
                                                    value={attributeRow.attribute_id}
                                                    onValueChange={(value) => updateAttributeSelection(index, value)}
                                                    options={attributeOptions}
                                                    placeholder="Select attribute"
                                                    searchPlaceholder="Search attribute"
                                                />

                                                <InputError message={formErrors[`${fieldKey}.attribute_id`]} />

                                                {selectedAttribute && (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            {selectedAttribute.is_required && (
                                                                <span className="text-xs font-medium text-destructive">Required</span>
                                                            )}
                                                            {selectedAttribute.is_filterable && (
                                                                <span className="text-xs text-muted-foreground">Filterable</span>
                                                            )}
                                                        </div>

                                                        <SearchableSelect
                                                            value={attributeRow.attribute_option_id}
                                                            onValueChange={(value) => updateAttributeValue(index, 'attribute_option_id', value)}
                                                            options={optionList}
                                                            placeholder={`Select ${selectedAttribute.name} value`}
                                                            searchPlaceholder={`Search ${selectedAttribute.name} value`}
                                                        />

                                                        <InputError message={formErrors[`${fieldKey}.value`] || formErrors[`${fieldKey}.attribute_option_id`]} />
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {data.attributes.length === 0 && (
                                        <p className="text-sm text-muted-foreground">Add one or more attributes to link them to this product.</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

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

                                        <div className="space-y-2 rounded-md border border-dashed p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-muted-foreground">Variant attributes</p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setActiveVariantAttributesIndex(index)}
                                                    disabled={variantAttributes.data.length === 0}
                                                >
                                                    Manage
                                                </Button>
                                            </div>

                                            {variantAttributes.data.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">
                                                    No variant attributes configured yet. Create them in Configuration → Attributes.
                                                </p>
                                            ) : (variant.attributes ?? []).length === 0 ? (
                                                <p className="text-xs text-muted-foreground">No attributes assigned.</p>
                                            ) : (
                                                <div className="space-y-1 text-xs">
                                                    {(variant.attributes ?? []).slice(0, MAX_VARIANT_ATTRIBUTES_PREVIEW).map((item, itemIndex) => {
                                                        const attribute = variantAttributes.data.find((candidate) => candidate.id.toString() === item.attribute_id);
                                                        const option = attribute?.attribute_options?.find((candidate) => candidate.id.toString() === item.attribute_option_id);

                                                        return (
                                                            <p key={`variant-${index}-attr-preview-${itemIndex}`}>
                                                                <span className="font-medium">{attribute?.name ?? 'Attribute'}:</span>{' '}
                                                                <span className="text-muted-foreground">{option?.label ?? option?.value ?? '—'}</span>
                                                            </p>
                                                        );
                                                    })}

                                                    {(variant.attributes ?? []).length > MAX_VARIANT_ATTRIBUTES_PREVIEW && (
                                                        <button type="button" className="text-primary underline" onClick={() => setActiveVariantAttributesIndex(index)}>
                                                            View all
                                                        </button>
                                                    )}
                                                </div>
                                            )}
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

            <Dialog open={activeVariantAttributesIndex !== null} onOpenChange={() => setActiveVariantAttributesIndex(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Variant attributes {activeVariantAttributesIndex !== null ? `#${activeVariantAttributesIndex + 1}` : ''}
                        </DialogTitle>
                    </DialogHeader>

                    {activeVariantAttributesIndex !== null && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Attributes</Label>
                                <Button type="button" size="sm" variant="outline" onClick={() => addVariantAttributeRow(activeVariantAttributesIndex)}>
                                    Add attribute
                                </Button>
                            </div>

                            {(data.variants[activeVariantAttributesIndex]?.attributes ?? []).map((attributeRow, rowIndex) => {
                                const selectedAttribute = variantAttributes.data.find((attribute) => attribute.id.toString() === attributeRow.attribute_id);
                                const usedAttributeIds = (data.variants[activeVariantAttributesIndex]?.attributes ?? [])
                                    .filter((_, itemIndex) => itemIndex !== rowIndex)
                                    .map((item) => item.attribute_id)
                                    .filter((item) => item !== '');

                                const availableAttributes = variantAttributes.data.filter(
                                    (attribute) => attribute.id.toString() === attributeRow.attribute_id || !usedAttributeIds.includes(attribute.id.toString()),
                                );

                                return (
                                    <div key={`variant-modal-${rowIndex}`} className="space-y-2 rounded-md border p-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Attribute</Label>
                                            <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeVariantAttributeRow(activeVariantAttributesIndex, rowIndex)}>
                                                Remove
                                            </Button>
                                        </div>

                                        <Select
                                            value={attributeRow.attribute_id}
                                            onValueChange={(value) => updateVariantAttributeSelection(activeVariantAttributesIndex, rowIndex, value)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select attribute" /></SelectTrigger>
                                            <SelectContent>
                                                {availableAttributes.map((attribute) => (
                                                    <SelectItem key={attribute.id} value={attribute.id.toString()}>
                                                        {attribute.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {selectedAttribute && (
                                            <Select
                                                value={attributeRow.attribute_option_id}
                                                onValueChange={(value) => updateVariantAttributeOption(activeVariantAttributesIndex, rowIndex, value)}
                                            >
                                                <SelectTrigger><SelectValue placeholder={`Select ${selectedAttribute.name} value`} /></SelectTrigger>
                                                <SelectContent>
                                                    {(selectedAttribute.attribute_options ?? []).map((option) => (
                                                        <SelectItem key={option.id} value={option.id.toString()}>
                                                            {option.label ?? option.value}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        <InputError message={formErrors[`variants.${activeVariantAttributesIndex}.attributes.${rowIndex}.attribute_id`]} />
                                        <InputError message={formErrors[`variants.${activeVariantAttributesIndex}.attributes.${rowIndex}.attribute_option_id`]} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
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
