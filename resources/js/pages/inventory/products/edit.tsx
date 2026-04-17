import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import InputError from '@/components/input-error';
import QuickCreateAttributeDialog from '@/components/inventory/quick-create-attribute-dialog';
import type { QuickCreatedAttribute } from '@/components/inventory/quick-create-attribute-dialog';
import QuickCreateAttributeOptionDialog from '@/components/inventory/quick-create-attribute-option-dialog';
import type { QuickCreatedAttributeOption } from '@/components/inventory/quick-create-attribute-option-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndex } from '@/routes/admin/products';
import type { Brand, Category, Product } from '@/types';

type Props = {
    product: {
        data: Product & {
            attribute_values?: Array<{
                attribute_id: number;
                value_text: string | null;
                value_textarea: string | null;
                value_number: number | null;
                value_decimal: string | null;
                value_boolean: boolean | null;
                value_date: string | null;
                attribute_option_id: number | null;
            }>;
        };
    };
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
        id?: number;
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

export default function ProductEdit({ product: { data: product }, brands, categories, attributes, variantAttributes }: Props) {
    const [activeVariantAttributesIndex, setActiveVariantAttributesIndex] = useState<number | null>(null);
    const [isQuickCreateAttributeOpen, setIsQuickCreateAttributeOpen] = useState(false);
    const [isQuickCreateAttributeOptionOpen, setIsQuickCreateAttributeOptionOpen] = useState(false);
    const [quickCreateDefaultLevels, setQuickCreateDefaultLevels] = useState<Array<'product' | 'variant' | 'serial'>>(['product']);
    const [quickCreateContext, setQuickCreateContext] = useState<{ scope: 'product' | 'variant'; variantIndex: number | null }>({
        scope: 'product',
        variantIndex: null,
    });
    const [quickCreateOptionContext, setQuickCreateOptionContext] = useState<{
        scope: 'product' | 'variant';
        attributeId: string;
        attributeName: string;
        productAttributeIndex: number | null;
        variantIndex: number | null;
        variantAttributeRowIndex: number | null;
    }>({
        scope: 'product',
        attributeId: '',
        attributeName: '',
        productAttributeIndex: null,
        variantIndex: null,
        variantAttributeRowIndex: null,
    });
    const [productAttributes, setProductAttributes] = useState(attributes.data);
    const [variantLevelAttributes, setVariantLevelAttributes] = useState(variantAttributes.data);
    const initialVariants: FormData['variants'] =
        product.variants && product.variants.length > 0
            ? product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                cost: variant.cost ?? '',
                price: variant.price ?? '',
                compare_price: variant.compare_price ?? '',
                attributes: (variant.attribute_values ?? []).map((attributeValue) => ({
                    attribute_id: attributeValue.attribute_id.toString(),
                    attribute_option_id: attributeValue.attribute_option_id ? attributeValue.attribute_option_id.toString() : '',
                })),
            }))
            : [
                {
                    sku: '',
                    cost: '',
                    price: '',
                    compare_price: '',
                    attributes: [],
                },
            ];

    const initialAttributes: FormData['attributes'] = (product.attribute_values ?? []).map((attributeValue) => {
        const attribute = productAttributes.find((item) => item.id === attributeValue.attribute_id);

        const normalizedValue = (() => {
            if (attributeValue.value_text !== null) {
                return attributeValue.value_text;
            }

            if (attributeValue.value_textarea !== null) {
                return attributeValue.value_textarea;
            }

            if (attributeValue.value_number !== null) {
                return attributeValue.value_number.toString();
            }

            if (attributeValue.value_decimal !== null) {
                return attributeValue.value_decimal;
            }

            if (attributeValue.value_boolean !== null) {
                return attributeValue.value_boolean ? 'true' : 'false';
            }

            if (attributeValue.value_date !== null) {
                return attributeValue.value_date;
            }

            return '';
        })();

        return {
            attribute_id: attribute?.id?.toString() ?? '',
            value: normalizedValue,
            attribute_option_id: attributeValue.attribute_option_id
                ? attributeValue.attribute_option_id.toString()
                : '',
        };
    }).filter((attribute) => attribute.attribute_id !== '');

    const { data, setData, transform, put, processing, errors } = useForm<FormData>({
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
        attributes: initialAttributes,
        variants: initialVariants,
    });

    const formErrors = errors as Record<string, string | undefined>;

    const attributesById = useMemo(
        () => new Map(productAttributes.map((attribute) => [attribute.id.toString(), attribute])),
        [productAttributes],
    );

    const attributeSelectorOptions = useMemo(
        () => productAttributes.map((attribute) => ({
            value: attribute.id.toString(),
            label: attribute.name,
            keywords: `${attribute.name} ${attribute.code}`,
        })),
        [productAttributes],
    );

    function applyCreatedAttributeSelection(attributeId: string): void {
        if (quickCreateContext.scope === 'product') {
            const nextAttributes = [...data.attributes];
            const targetIndex = nextAttributes.findIndex((row) => row.attribute_id === '');

            if (targetIndex >= 0) {
                nextAttributes[targetIndex] = {
                    attribute_id: attributeId,
                    value: '',
                    attribute_option_id: '',
                };
            } else {
                nextAttributes.push({
                    attribute_id: attributeId,
                    value: '',
                    attribute_option_id: '',
                });
            }

            setData('attributes', nextAttributes);

            return;
        }

        if (quickCreateContext.variantIndex === null) {
            return;
        }

        const nextVariants = [...data.variants];
        const currentVariant = nextVariants[quickCreateContext.variantIndex];

        if (!currentVariant) {
            return;
        }

        const nextAttributes = [...(currentVariant.attributes ?? [])];
        const targetIndex = nextAttributes.findIndex((row) => row.attribute_id === '');

        if (targetIndex >= 0) {
            nextAttributes[targetIndex] = {
                attribute_id: attributeId,
                attribute_option_id: '',
            };
        } else {
            nextAttributes.push({
                attribute_id: attributeId,
                attribute_option_id: '',
            });
        }

        nextVariants[quickCreateContext.variantIndex] = {
            ...currentVariant,
            attributes: nextAttributes,
        };

        setData('variants', nextVariants);
        setActiveVariantAttributesIndex(quickCreateContext.variantIndex);
    }

    function handleQuickAttributeCreated(attribute: QuickCreatedAttribute): void {
        const levels = new Set(attribute.entity_levels ?? [attribute.entity_level]);

        if (levels.has('product')) {
            setProductAttributes((previous) => {
                if (previous.some((item) => item.id === attribute.id)) {
                    return previous;
                }

                return [...previous, attribute];
            });
        }

        if (levels.has('variant')) {
            setVariantLevelAttributes((previous) => {
                if (previous.some((item) => item.id === attribute.id)) {
                    return previous;
                }

                return [...previous, attribute];
            });
        }

        if ((quickCreateContext.scope === 'product' && levels.has('product')) || (quickCreateContext.scope === 'variant' && levels.has('variant'))) {
            applyCreatedAttributeSelection(attribute.id.toString());
        }
    }

    function updateAttributeOptionsInCollection(
        collection: Props['attributes']['data'],
        attributeId: number,
        option: QuickCreatedAttributeOption,
    ): Props['attributes']['data'] {
        return collection.map((attribute) => {
            if (attribute.id !== attributeId) {
                return attribute;
            }

            if ((attribute.attribute_options ?? []).some((existingOption) => existingOption.id === option.id)) {
                return attribute;
            }

            return {
                ...attribute,
                attribute_options: [
                    ...(attribute.attribute_options ?? []),
                    {
                        id: option.id,
                        value: option.value,
                        label: option.label,
                    },
                ],
            };
        });
    }

    function handleQuickAttributeOptionCreated(option: QuickCreatedAttributeOption): void {
        setProductAttributes((previous) => updateAttributeOptionsInCollection(previous, option.attribute_id, option));
        setVariantLevelAttributes((previous) => updateAttributeOptionsInCollection(previous, option.attribute_id, option));

        const optionId = option.id.toString();
        const optionAttributeId = option.attribute_id.toString();

        if (quickCreateOptionContext.scope === 'product' && quickCreateOptionContext.productAttributeIndex !== null) {
            const row = data.attributes[quickCreateOptionContext.productAttributeIndex];

            if (row && row.attribute_id === optionAttributeId) {
                updateAttributeValue(quickCreateOptionContext.productAttributeIndex, 'attribute_option_id', optionId);
            }

            return;
        }

        if (
            quickCreateOptionContext.scope === 'variant'
            && quickCreateOptionContext.variantIndex !== null
            && quickCreateOptionContext.variantAttributeRowIndex !== null
        ) {
            const variantRow = data.variants[quickCreateOptionContext.variantIndex];
            const attributeRow = variantRow?.attributes?.[quickCreateOptionContext.variantAttributeRowIndex];

            if (attributeRow && attributeRow.attribute_id === optionAttributeId) {
                updateVariantAttributeOption(quickCreateOptionContext.variantIndex, quickCreateOptionContext.variantAttributeRowIndex, optionId);
            }
        }
    }

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

        transform((payload) => ({
            ...payload,
            attributes: payload.attributes.filter((attributeRow) => attributeRow.attribute_id !== ''),
            variants: payload.variants.map((variant) => ({
                ...variant,
                attributes: (variant.attributes ?? []).filter((attributeRow) => attributeRow.attribute_id !== ''),
            })),
        }));

        put(ProductController.update.url(product), {
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
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <CardTitle>Attributes</CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            Filled: {filledAttributeCount}/{data.attributes.length} · Required:{' '}
                                            {completedRequiredCount}/{requiredAttributeCount}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setQuickCreateDefaultLevels(['product']);
                                                setQuickCreateContext({ scope: 'product', variantIndex: null });
                                                setIsQuickCreateAttributeOpen(true);
                                            }}
                                        >
                                            New attribute
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={productAttributes.length === 0}
                                            onClick={() => {
                                                if (data.attributes.length === 0) {
                                                    addAttributeRow();
                                                }
                                            }}
                                        >
                                            Manage
                                        </Button>
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
                                {productAttributes.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No product attributes configured yet. Create them in Configuration → Attributes.
                                    </p>
                                )}

                                {productAttributes.length > 0 && (
                                    <>
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

                                                        <div className="flex justify-end">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setQuickCreateOptionContext({
                                                                        scope: 'product',
                                                                        attributeId: selectedAttribute.id.toString(),
                                                                        attributeName: selectedAttribute.name,
                                                                        productAttributeIndex: index,
                                                                        variantIndex: null,
                                                                        variantAttributeRowIndex: null,
                                                                    });
                                                                    setIsQuickCreateAttributeOptionOpen(true);
                                                                }}
                                                            >
                                                                New value
                                                            </Button>
                                                        </div>

                                                        <InputError message={formErrors[`${fieldKey}.value`] || formErrors[`${fieldKey}.attribute_option_id`]} />
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {data.attributes.length === 0 && (
                                        <p className="text-sm text-muted-foreground">Add one or more attributes to link them to this product.</p>
                                    )}
                                    </>
                                )}
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

                                        <div className="space-y-2 rounded-md border border-dashed p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-muted-foreground">Variant attributes</p>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setQuickCreateDefaultLevels(['variant']);
                                                            setQuickCreateContext({ scope: 'variant', variantIndex: index });
                                                            setIsQuickCreateAttributeOpen(true);
                                                        }}
                                                    >
                                                        New attribute
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setActiveVariantAttributesIndex(index)}
                                                        disabled={variantLevelAttributes.length === 0}
                                                    >
                                                        Manage
                                                    </Button>
                                                </div>
                                            </div>

                                            {variantLevelAttributes.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">
                                                    No variant attributes configured yet. Create them in Configuration → Attributes.
                                                </p>
                                            ) : (variant.attributes ?? []).length === 0 ? (
                                                <p className="text-xs text-muted-foreground">No attributes assigned.</p>
                                            ) : (
                                                <div className="space-y-1 text-xs">
                                                    {(variant.attributes ?? []).slice(0, MAX_VARIANT_ATTRIBUTES_PREVIEW).map((item, itemIndex) => {
                                                        const attribute = variantLevelAttributes.find((candidate) => candidate.id.toString() === item.attribute_id);
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
                                    <Select value={data.status} onValueChange={v => setData('status', v as 'draft' | 'active' | 'inactive')}>
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
                                    <Select value={data.product_type} onValueChange={v => setData('product_type', v as 'simple' | 'variant' | 'serializable')}>
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
                                const selectedAttribute = variantLevelAttributes.find((attribute) => attribute.id.toString() === attributeRow.attribute_id);
                                const usedAttributeIds = (data.variants[activeVariantAttributesIndex]?.attributes ?? [])
                                    .filter((_, itemIndex) => itemIndex !== rowIndex)
                                    .map((item) => item.attribute_id)
                                    .filter((item) => item !== '');

                                const availableAttributes = variantLevelAttributes.filter(
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
                                            <>
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

                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setQuickCreateOptionContext({
                                                                scope: 'variant',
                                                                attributeId: selectedAttribute.id.toString(),
                                                                attributeName: selectedAttribute.name,
                                                                productAttributeIndex: null,
                                                                variantIndex: activeVariantAttributesIndex,
                                                                variantAttributeRowIndex: rowIndex,
                                                            });
                                                            setIsQuickCreateAttributeOptionOpen(true);
                                                        }}
                                                    >
                                                        New value
                                                    </Button>
                                                </div>
                                            </>
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

            <QuickCreateAttributeDialog
                open={isQuickCreateAttributeOpen}
                onOpenChange={setIsQuickCreateAttributeOpen}
                defaultLevels={quickCreateDefaultLevels}
                onCreated={handleQuickAttributeCreated}
            />

            <QuickCreateAttributeOptionDialog
                open={isQuickCreateAttributeOptionOpen}
                onOpenChange={setIsQuickCreateAttributeOptionOpen}
                attributeId={quickCreateOptionContext.attributeId === '' ? null : Number(quickCreateOptionContext.attributeId)}
                attributeName={quickCreateOptionContext.attributeName}
                onCreated={handleQuickAttributeOptionCreated}
            />
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
