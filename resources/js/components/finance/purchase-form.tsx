import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import type { Product, Warehouse } from '@/types';

const NO_VENDOR = '__none__';

type Vendor = { id: number; name: string };

type PurchaseFormItem = {
    product_variant_id: string;
    description: string;
    quantity: string;
    unit_cost: string;
    _variant_label: string;
};

type PurchaseFormData = {
    vendor_id: string;
    vendor_name: string;
    warehouse_id: string;
    reference: string;
    purchased_at: string;
    tax_total: string;
    discount_total: string;
    balance_due: string;
    notes: string;
    items: PurchaseFormItem[];
};

type PurchaseData = {
    id: number;
    vendor_id: number | null;
    vendor_name: string;
    warehouse_id: number | null;
    reference: string | null;
    purchased_at: string | null;
    tax_total: string;
    discount_total: string;
    balance_due: string | null;
    notes: string | null;
    items?: Array<{
        id: number;
        product_variant_id: number | null;
        description: string;
        quantity: string;
        unit_cost: string;
        product_variant?: {
            sku?: string | null;
            attribute_summary?: string | null;
            product?: { name?: string | null } | null;
        } | null;
    }>;
};

type VariantOption = {
    value: string;
    label: string;
    price: string;
    keywords: string;
};

type Props = {
    title: string;
    description: string;
    submitLabel: string;
    cancelHref: string;
    submitUrl: string;
    method: 'post' | 'put';
    vendors: Vendor[];
    warehouses: Warehouse[];
    products: Product[];
    initialPurchase?: PurchaseData;
};

export default function PurchaseForm({
    title,
    description,
    submitLabel,
    cancelHref,
    submitUrl,
    method,
    vendors,
    warehouses,
    products,
    initialPurchase,
}: Props) {
    const variantOptions = useMemo<VariantOption[]>(() => {
        return products.flatMap((product) =>
            (product.variants ?? []).map((variant) => {
                const labelParts = [product.name, variant.sku];
                if (variant.attribute_summary) {
                    labelParts.push(variant.attribute_summary);
                }

                return {
                    value: String(variant.id),
                    label: labelParts.filter(Boolean).join(' · '),
                    price: variant.price ?? '0',
                    keywords: [product.name, product.sku, product.brand?.name, variant.sku, variant.attribute_summary]
                        .filter(Boolean)
                        .join(' '),
                };
            }),
        );
    }, [products]);

    const variantSearchOptions = useMemo<SearchableSelectOption[]>(() => {
        return variantOptions.map((o) => ({ value: o.value, label: o.label, keywords: o.keywords }));
    }, [variantOptions]);

    const optionsById = useMemo(() => new Map(variantOptions.map((o) => [o.value, o])), [variantOptions]);

    const form = useForm<PurchaseFormData>({
        vendor_id: initialPurchase?.vendor_id ? String(initialPurchase.vendor_id) : '',
        vendor_name: initialPurchase?.vendor_name ?? '',
        warehouse_id: initialPurchase?.warehouse_id ? String(initialPurchase.warehouse_id) : '',
        reference: initialPurchase?.reference ?? '',
        purchased_at: initialPurchase?.purchased_at?.slice(0, 10) ?? '',
        tax_total: initialPurchase?.tax_total ?? '0',
        discount_total: initialPurchase?.discount_total ?? '0',
        balance_due: initialPurchase?.balance_due ?? '0',
        notes: initialPurchase?.notes ?? '',
        items: (initialPurchase?.items ?? []).map((item) => {
            const option = item.product_variant_id ? optionsById.get(String(item.product_variant_id)) : undefined;

            return {
                product_variant_id: item.product_variant_id ? String(item.product_variant_id) : '',
                description: item.description,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                _variant_label: option?.label ?? '',
            };
        }),
    });

    const subtotal = useMemo(
        () => form.data.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_cost || 0), 0),
        [form.data.items],
    );

    const total = useMemo(
        () => Math.max(0, subtotal + Number(form.data.tax_total || 0) - Number(form.data.discount_total || 0)),
        [subtotal, form.data.tax_total, form.data.discount_total],
    );

    function addItem() {
        form.setData('items', [
            ...form.data.items,
            { product_variant_id: '', description: '', quantity: '1', unit_cost: '0', _variant_label: '' },
        ]);
    }

    function updateItem<K extends keyof PurchaseFormItem>(index: number, key: K, value: PurchaseFormItem[K]) {
        form.setData(
            'items',
            form.data.items.map((item, i) => (i !== index ? item : { ...item, [key]: value })),
        );
    }

    function setVariant(index: number, variantId: string) {
        const option = optionsById.get(variantId);
        form.setData(
            'items',
            form.data.items.map((item, i) => {
                if (i !== index) return item;
                if (!option) return { ...item, product_variant_id: variantId, _variant_label: '' };

                return {
                    ...item,
                    product_variant_id: variantId,
                    _variant_label: option.label,
                    description: item.description || option.label,
                    unit_cost: !item.unit_cost || item.unit_cost === '0' ? option.price : item.unit_cost,
                };
            }),
        );
    }

    function removeItem(index: number) {
        form.setData('items', form.data.items.filter((_, i) => i !== index));
    }

    function getItemError(index: number, field: string): string | undefined {
        return (form.errors as Record<string, string | undefined>)[`items.${index}.${field}`];
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.transform((data) => ({
            vendor_id: data.vendor_id ? Number(data.vendor_id) : null,
            vendor_name: data.vendor_id ? null : (data.vendor_name || null),
            warehouse_id: data.warehouse_id ? Number(data.warehouse_id) : null,
            reference: data.reference || null,
            purchased_at: data.purchased_at || null,
            tax_total: data.tax_total || 0,
            discount_total: data.discount_total || 0,
            balance_due: data.balance_due || total,
            notes: data.notes || null,
            items: data.items.map((item) => ({
                product_variant_id: item.product_variant_id ? Number(item.product_variant_id) : null,
                description: item.description,
                quantity: Number(item.quantity || 0),
                unit_cost: Number(item.unit_cost || 0),
            })),
        }));

        if (method === 'post') {
            form.post(submitUrl);
        } else {
            form.put(submitUrl);
        }
    }

    const hasVendor = !!form.data.vendor_id;

    return (
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
                <div className="space-y-4">
                    {/* Purchase details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Vendor</Label>
                                <Select
                                    value={form.data.vendor_id || NO_VENDOR}
                                    onValueChange={(v) => form.setData('vendor_id', v === NO_VENDOR ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_VENDOR}>Free-text (no vendor)</SelectItem>
                                        {vendors.map((v) => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.vendor_id} />
                            </div>

                            {!hasVendor && (
                                <div className="space-y-2">
                                    <Label htmlFor="vendor_name">Vendor name *</Label>
                                    <Input
                                        id="vendor_name"
                                        value={form.data.vendor_name}
                                        onChange={(e) => form.setData('vendor_name', e.target.value)}
                                        placeholder="Supplier name"
                                    />
                                    <InputError message={form.errors.vendor_name} />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Warehouse *</Label>
                                <Select
                                    value={form.data.warehouse_id || NO_VENDOR}
                                    onValueChange={(v) => form.setData('warehouse_id', v === NO_VENDOR ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select warehouse" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_VENDOR}>No warehouse</SelectItem>
                                        {warehouses.map((w) => (
                                            <SelectItem key={w.id} value={String(w.id)}>
                                                {w.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.warehouse_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reference">Vendor invoice / reference</Label>
                                <Input
                                    id="reference"
                                    value={form.data.reference}
                                    onChange={(e) => form.setData('reference', e.target.value)}
                                    placeholder="INV-001"
                                />
                                <InputError message={form.errors.reference} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="purchased_at">Purchase date</Label>
                                <Input
                                    id="purchased_at"
                                    type="date"
                                    value={form.data.purchased_at}
                                    onChange={(e) => form.setData('purchased_at', e.target.value)}
                                />
                                <InputError message={form.errors.purchased_at} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    rows={2}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    placeholder="Internal notes for this purchase"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Items</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add line
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {form.data.items.length === 0 && (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Add at least one item to save this purchase.
                                </p>
                            )}
                            {form.errors.items && <InputError message={form.errors.items} />}

                            {form.data.items.map((item, index) => (
                                <div key={index} className="space-y-3 rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">
                                            {item._variant_label || `Line ${index + 1}`}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <div className="space-y-2 md:col-span-2 xl:col-span-4">
                                            <Label>Variant</Label>
                                            <SearchableSelect
                                                value={item.product_variant_id}
                                                onValueChange={(v) => setVariant(index, v)}
                                                options={variantSearchOptions}
                                                placeholder="Select product variant"
                                                searchPlaceholder="Search by product, SKU, brand..."
                                                emptyMessage="No variants found."
                                            />
                                            <InputError message={getItemError(index, 'product_variant_id')} />
                                        </div>

                                        <div className="space-y-2 md:col-span-2 xl:col-span-4">
                                            <Label>Description *</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            />
                                            <InputError message={getItemError(index, 'description')} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Quantity *</Label>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            />
                                            <InputError message={getItemError(index, 'quantity')} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Unit cost *</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_cost}
                                                onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                            />
                                            <InputError message={getItemError(index, 'unit_cost')} />
                                        </div>

                                        <div className="space-y-2 xl:col-span-2">
                                            <Label>Line total</Label>
                                            <Input
                                                readOnly
                                                value={formatCurrency(
                                                    Number(item.quantity || 0) * Number(item.unit_cost || 0),
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: totals */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Totals</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tax_total">Tax total</Label>
                                <Input
                                    id="tax_total"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.tax_total}
                                    onChange={(e) => form.setData('tax_total', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="discount_total">Discount total</Label>
                                <Input
                                    id="discount_total"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.discount_total}
                                    onChange={(e) => form.setData('discount_total', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="balance_due">Balance due</Label>
                                <Input
                                    id="balance_due"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.balance_due}
                                    onChange={(e) => form.setData('balance_due', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 rounded-lg border p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span className="font-mono">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button type="submit" disabled={form.processing || form.data.items.length === 0}>
                                    {form.processing ? 'Saving...' : submitLabel}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={cancelHref}>Cancel</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
