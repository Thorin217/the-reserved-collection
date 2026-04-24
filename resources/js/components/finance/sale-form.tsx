import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    SearchableSelect,
    type SearchableSelectOption,
} from '@/components/ui/searchable-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import type { Client, Product, Warehouse } from '@/types';

type SaleFormItem = {
    id?: number;
    product_variant_id: string;
    description: string;
    quantity: string;
    unit_price: string;
    _variant_label: string;
};

type SaleFormData = {
    client_id: string;
    warehouse_id: string;
    status: 'draft' | 'cancelled';
    payment_type: 'cash' | 'credit';
    sold_at: string;
    tax_total: string;
    discount_total: string;
    balance_due: string;
    notes: string;
    items: SaleFormItem[];
};

type SaleData = {
    id: number;
    status: 'draft' | 'confirmed' | 'cancelled';
    payment_type: 'cash' | 'credit';
    client_id: number;
    warehouse_id: number | null;
    sold_at: string | null;
    tax_total: string;
    discount_total: string;
    balance_due: string;
    notes: string | null;
    items?: Array<{
        id: number;
        product_variant_id: number | null;
        description: string;
        quantity: string;
        unit_price: string;
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
    clients: Client[];
    warehouses: Warehouse[];
    products: Product[];
    initialSale?: SaleData;
};

export default function SaleForm({
    title,
    description,
    submitLabel,
    cancelHref,
    submitUrl,
    method,
    clients,
    warehouses,
    products,
    initialSale,
}: Props) {
    const variantOptions = useMemo<VariantOption[]>(() => {
        return products.flatMap((product) => {
            return (product.variants ?? []).map((variant) => {
                const labelParts = [product.name, variant.sku];

                if (variant.attribute_summary) {
                    labelParts.push(variant.attribute_summary);
                }

                return {
                    value: String(variant.id),
                    label: labelParts.filter(Boolean).join(' · '),
                    price: variant.price ?? '0',
                    keywords: [
                        product.name,
                        product.sku,
                        product.brand?.name,
                        variant.sku,
                        variant.attribute_summary,
                    ]
                        .filter(Boolean)
                        .join(' '),
                };
            });
        });
    }, [products]);

    const variantSearchOptions = useMemo<SearchableSelectOption[]>(() => {
        return variantOptions.map((option) => ({
            value: option.value,
            label: option.label,
            keywords: option.keywords,
        }));
    }, [variantOptions]);

    const optionsById = useMemo(() => {
        return new Map(variantOptions.map((option) => [option.value, option]));
    }, [variantOptions]);

    const form = useForm<SaleFormData>({
        client_id: initialSale?.client_id ? String(initialSale.client_id) : '',
        warehouse_id: initialSale?.warehouse_id ? String(initialSale.warehouse_id) : '',
        status: initialSale?.status === 'cancelled' ? 'cancelled' : 'draft',
        payment_type: initialSale?.payment_type ?? 'credit',
        sold_at: initialSale?.sold_at?.slice(0, 10) ?? '',
        tax_total: initialSale?.tax_total ?? '0',
        discount_total: initialSale?.discount_total ?? '0',
        balance_due: initialSale?.balance_due ?? '',
        notes: initialSale?.notes ?? '',
        items: (initialSale?.items ?? []).map((item) => {
            const option = item.product_variant_id
                ? optionsById.get(String(item.product_variant_id))
                : undefined;

            return {
                id: item.id,
                product_variant_id: item.product_variant_id
                    ? String(item.product_variant_id)
                    : '',
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                _variant_label: option?.label ?? '',
            };
        }),
    });

    const subtotal = useMemo(() => {
        return form.data.items.reduce((sum, item) => {
            const quantity = Number.parseFloat(item.quantity || '0');
            const unitPrice = Number.parseFloat(item.unit_price || '0');

            return sum + quantity * unitPrice;
        }, 0);
    }, [form.data.items]);

    const total = useMemo(() => {
        const taxTotal = Number.parseFloat(form.data.tax_total || '0');
        const discountTotal = Number.parseFloat(form.data.discount_total || '0');

        return Math.max(0, subtotal + taxTotal - discountTotal);
    }, [form.data.discount_total, form.data.tax_total, subtotal]);

    useEffect(() => {
        const creditBalanceDue = total.toFixed(2);

        if (
            form.data.payment_type === 'credit'
            && form.data.balance_due !== creditBalanceDue
        ) {
            form.setData('balance_due', creditBalanceDue);
        }
    }, [form.data.balance_due, form.data.payment_type, form.setData, total]);

    function addItem() {
        form.setData('items', [
            ...form.data.items,
            {
                product_variant_id: '',
                description: '',
                quantity: '1',
                unit_price: '0',
                _variant_label: '',
            },
        ]);
    }

    function updateItem<K extends keyof SaleFormItem>(
        index: number,
        key: K,
        value: SaleFormItem[K],
    ) {
        form.setData(
            'items',
            form.data.items.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                return {
                    ...item,
                    [key]: value,
                };
            }),
        );
    }

    function setVariant(index: number, variantId: string) {
        const option = optionsById.get(variantId);

        form.setData(
            'items',
            form.data.items.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                if (!option) {
                    return {
                        ...item,
                        product_variant_id: variantId,
                        _variant_label: '',
                    };
                }

                return {
                    ...item,
                    product_variant_id: variantId,
                    _variant_label: option.label,
                    description: item.description || option.label,
                    unit_price:
                        !item.unit_price || item.unit_price === '0' ? option.price : item.unit_price,
                };
            }),
        );
    }

    function removeItem(index: number) {
        form.setData(
            'items',
            form.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    function getItemError(index: number, field: string): string | undefined {
        const itemErrors = form.errors as Record<string, string | undefined>;

        return itemErrors[`items.${index}.${field}`];
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.transform((data) => ({
            client_id: Number(data.client_id),
            warehouse_id: data.warehouse_id ? Number(data.warehouse_id) : null,
            status: data.status,
            payment_type: data.payment_type,
            sold_at: data.sold_at || null,
            tax_total: data.tax_total || 0,
            discount_total: data.discount_total || 0,
            balance_due: data.payment_type === 'credit' ? total : (data.balance_due || total),
            notes: data.notes || null,
            items: data.items.map((item) => ({
                product_variant_id: item.product_variant_id
                    ? Number(item.product_variant_id)
                    : null,
                description: item.description,
                quantity: Number(item.quantity || 0),
                unit_price: Number(item.unit_price || 0),
            })),
        }));

        if (method === 'post') {
            form.post(submitUrl);

            return;
        }

        form.put(submitUrl);
    }

    return (
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sale details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Client *</Label>
                                <Select
                                    value={form.data.client_id}
                                    onValueChange={(value) => form.setData('client_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={String(client.id)}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.client_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>Warehouse</Label>
                                <Select
                                    value={form.data.warehouse_id || '__none__'}
                                    onValueChange={(value) =>
                                        form.setData('warehouse_id', value === '__none__' ? '' : value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select warehouse" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">No warehouse</SelectItem>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.warehouse_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>Status *</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(value: 'draft' | 'cancelled') =>
                                        form.setData('status', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.status} />
                            </div>

                            <div className="space-y-2">
                                <Label>Payment type *</Label>
                                <Select
                                    value={form.data.payment_type}
                                    onValueChange={(value: 'cash' | 'credit') => {
                                        form.setData('payment_type', value);

                                        if (value === 'credit') {
                                            form.setData('balance_due', total.toFixed(2));
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit">Credit</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.payment_type} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sold_at">Sold at</Label>
                                <Input
                                    id="sold_at"
                                    type="date"
                                    value={form.data.sold_at}
                                    onChange={(event) => form.setData('sold_at', event.target.value)}
                                />
                                <InputError message={form.errors.sold_at} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    rows={3}
                                    value={form.data.notes}
                                    onChange={(event) => form.setData('notes', event.target.value)}
                                    placeholder="Internal context for this sale"
                                />
                                <InputError message={form.errors.notes} />
                            </div>
                        </CardContent>
                    </Card>

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
                                    Add at least one item to save this sale.
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
                                            <Label>Variant *</Label>
                                            <SearchableSelect
                                                value={item.product_variant_id}
                                                onValueChange={(value) => setVariant(index, value)}
                                                options={variantSearchOptions}
                                                placeholder="Select product variant"
                                                searchPlaceholder="Search by product, SKU, brand or attributes..."
                                                emptyMessage="No variants found."
                                            />
                                            <InputError message={getItemError(index, 'product_variant_id')} />
                                        </div>

                                        <div className="space-y-2 md:col-span-2 xl:col-span-4">
                                            <Label>Description *</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(event) =>
                                                    updateItem(index, 'description', event.target.value)
                                                }
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
                                                onChange={(event) =>
                                                    updateItem(index, 'quantity', event.target.value)
                                                }
                                            />
                                            <InputError message={getItemError(index, 'quantity')} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Unit price *</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(event) =>
                                                    updateItem(index, 'unit_price', event.target.value)
                                                }
                                            />
                                            <InputError message={getItemError(index, 'unit_price')} />
                                        </div>

                                        <div className="space-y-2 xl:col-span-2">
                                            <Label>Line total</Label>
                                            <Input
                                                readOnly
                                                value={formatCurrency(
                                                    (Number(item.quantity || 0) * Number(item.unit_price || 0)) || 0,
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

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
                                    onChange={(event) => form.setData('tax_total', event.target.value)}
                                />
                                <InputError message={form.errors.tax_total} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="discount_total">Discount total</Label>
                                <Input
                                    id="discount_total"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.discount_total}
                                    onChange={(event) => form.setData('discount_total', event.target.value)}
                                />
                                <InputError message={form.errors.discount_total} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="balance_due">Balance due</Label>
                                <Input
                                    id="balance_due"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.balance_due}
                                    disabled={form.data.payment_type === 'credit'}
                                    onChange={(event) => form.setData('balance_due', event.target.value)}
                                    placeholder={String(total)}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Amount still owed. Set to 0 if paid in full at point of sale.
                                </p>
                                <InputError message={form.errors.balance_due} />
                                {form.data.payment_type === 'credit' && (
                                    <p className="text-xs text-muted-foreground">
                                        Credit sales keep the full balance due until payments are recorded.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 rounded-lg border p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-mono">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    type="submit"
                                    disabled={form.processing || form.data.items.length === 0}
                                >
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
