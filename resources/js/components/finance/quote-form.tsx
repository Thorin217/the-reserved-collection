import { Link, useForm } from '@inertiajs/react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import type { Client, Lead, Product, ProductVariant, Quote, QuoteStatus } from '@/types';

type Option = {
    value: string;
    label: string;
};

type QuoteFormItem = {
    id?: number;
    product_variant_id: string;
    product_serial_id: string;
    description: string;
    quantity: string;
    unit_price: string;
    notes: string;
    _product_name: string;
    _variant_sku: string;
    _variant_summary: string;
};

type QuoteFormData = {
    client_id: string;
    lead_id: string;
    status: QuoteStatus;
    currency: 'USD' | 'GTQ';
    issued_at: string;
    expires_at: string;
    tax_total: string;
    discount_total: string;
    notes: string;
    items: QuoteFormItem[];
};

type QuoteFormProps = {
    title: string;
    description: string;
    submitLabel: string;
    cancelHref: string;
    submitUrl: string;
    method: 'post' | 'put';
    clients: Client[];
    leads: Lead[];
    products: Product[];
    statuses: Option[];
    currencies: Option[];
    initialQuote?: Quote;
    headerActions?: React.ReactNode;
};

function ProductPickerDialog({
    products,
    onSelect,
}: {
    products: Product[];
    onSelect: (product: Product, variant: ProductVariant) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const filteredProducts = useMemo(() => {
        const query = search.toLowerCase().trim();

        if (!query) {
            return products;
        }

        return products.filter((product) => {
            return (
                product.name.toLowerCase().includes(query) ||
                product.sku.toLowerCase().includes(query) ||
                product.brand?.name?.toLowerCase().includes(query)
            );
        });
    }, [products, search]);

    function pickVariant(product: Product, variant: ProductVariant | null) {
        if (!variant) {
            return;
        }

        onSelect(product, variant);
        setOpen(false);
        setSearch('');
        setSelectedProduct(null);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Select inventory item</DialogTitle>
                </DialogHeader>

                <Input
                    placeholder="Search by product, SKU or brand..."
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setSelectedProduct(null);
                    }}
                    autoFocus
                />

                <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {filteredProducts.length === 0 && (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            No active products found.
                        </p>
                    )}

                    {filteredProducts.map((product) => {
                        const variants = product.variants ?? [];
                        const hasMultipleVariants = variants.length > 1;

                        return (
                            <div key={product.id}>
                                <button
                                    type="button"
                                    className="flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
                                    onClick={() => {
                                        if (hasMultipleVariants) {
                                            setSelectedProduct(product);

                                            return;
                                        }

                                        pickVariant(product, variants[0] ?? null);
                                    }}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            SKU: {product.sku}
                                            {product.brand?.name ? ` · ${product.brand.name}` : ''}
                                        </p>
                                    </div>
                                    {hasMultipleVariants && (
                                        <span className="text-xs text-muted-foreground">
                                            {variants.length} variants
                                        </span>
                                    )}
                                </button>

                                {selectedProduct?.id === product.id && (
                                    <div className="ml-4 mt-2 space-y-1 border-l-2 border-muted pl-3">
                                        {variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                type="button"
                                                className="flex w-full items-center justify-between rounded px-2 py-2 text-sm hover:bg-muted/50"
                                                onClick={() => pickVariant(product, variant)}
                                            >
                                                <div>
                                                    <p className="font-mono text-xs text-muted-foreground">
                                                        {variant.sku}
                                                    </p>
                                                    <p>
                                                        {variant.attribute_summary ??
                                                            'Default variant'}
                                                    </p>
                                                </div>
                                                <span className="font-mono text-xs">
                                                    {variant.price
                                                        ? formatCurrency(variant.price)
                                                        : 'No price'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function QuoteForm({
    title,
    description,
    submitLabel,
    cancelHref,
    submitUrl,
    method,
    clients,
    leads,
    products,
    statuses,
    currencies,
    initialQuote,
    headerActions,
}: QuoteFormProps) {
    const form = useForm<QuoteFormData>({
        client_id: initialQuote?.client_id ? String(initialQuote.client_id) : '',
        lead_id: initialQuote?.lead_id ? String(initialQuote.lead_id) : '',
        status: initialQuote?.status ?? 'draft',
        currency: initialQuote?.currency ?? 'USD',
        issued_at: initialQuote?.issued_at?.slice(0, 10) ?? '',
        expires_at: initialQuote?.expires_at?.slice(0, 10) ?? '',
        tax_total: initialQuote?.tax_total ?? '0.00',
        discount_total: initialQuote?.discount_total ?? '0.00',
        notes: initialQuote?.notes ?? '',
        items: (initialQuote?.items ?? []).map((item) => ({
            id: item.id,
            product_variant_id: item.product_variant_id
                ? String(item.product_variant_id)
                : '',
            product_serial_id: item.product_serial_id
                ? String(item.product_serial_id)
                : '',
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            notes: item.notes ?? '',
            _product_name: item.product_variant?.product?.name ??
                item.description,
            _variant_sku: item.product_variant?.sku ?? '',
            _variant_summary: item.product_variant?.attribute_summary ?? '',
        })),
    });

    const filteredLeads = useMemo(() => {
        if (!form.data.client_id) {
            return leads;
        }

        return leads.filter(
            (lead) => String(lead.client?.id ?? '') === form.data.client_id,
        );
    }, [form.data.client_id, leads]);

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

    function addItem(product: Product, variant: ProductVariant) {
        const description = variant.attribute_summary
            ? `${product.name} - ${variant.attribute_summary}`
            : product.name;

        form.setData('items', [
            ...form.data.items,
            {
                product_variant_id: String(variant.id),
                product_serial_id: '',
                description,
                quantity: '1',
                unit_price: variant.price ?? '0.00',
                notes: '',
                _product_name: product.name,
                _variant_sku: variant.sku,
                _variant_summary: variant.attribute_summary ?? '',
            },
        ]);
    }

    function updateItem<K extends keyof QuoteFormItem>(
        index: number,
        key: K,
        value: QuoteFormItem[K],
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

    function removeItem(index: number) {
        form.setData(
            'items',
            form.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    function getItemError(index: number, field: string): string | undefined {
        return form.errors[`items.${index}.${field}`];
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.transform((data) => ({
            client_id: Number(data.client_id),
            lead_id: data.lead_id ? Number(data.lead_id) : null,
            status: data.status,
            currency: data.currency,
            issued_at: data.issued_at || null,
            expires_at: data.expires_at || null,
            tax_total: data.tax_total || 0,
            discount_total: data.discount_total || 0,
            notes: data.notes || null,
            items: data.items.map((item) => ({
                product_variant_id: Number(item.product_variant_id),
                product_serial_id: item.product_serial_id
                    ? Number(item.product_serial_id)
                    : null,
                description: item.description,
                quantity: Number(item.quantity || 0),
                unit_price: Number(item.unit_price || 0),
                notes: item.notes || null,
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
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                {headerActions}
            </div>

            <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quote details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Client *</Label>
                                <Select
                                    value={form.data.client_id}
                                    onValueChange={(value) => {
                                        form.setData('client_id', value);

                                        if (
                                            form.data.lead_id &&
                                            !filteredLeads.some(
                                                (lead) =>
                                                    String(lead.id) ===
                                                    form.data.lead_id,
                                            )
                                        ) {
                                            form.setData('lead_id', '');
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem
                                                key={client.id}
                                                value={String(client.id)}
                                            >
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.client_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>Lead</Label>
                                <Select
                                    value={form.data.lead_id || '__none__'}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'lead_id',
                                            value === '__none__' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Optional lead" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">
                                            No lead
                                        </SelectItem>
                                        {filteredLeads.map((lead) => (
                                            <SelectItem
                                                key={lead.id}
                                                value={String(lead.id)}
                                            >
                                                {lead.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.lead_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>Status *</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(value: QuoteStatus) =>
                                        form.setData('status', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((status) => (
                                            <SelectItem
                                                key={status.value}
                                                value={status.value}
                                            >
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.status} />
                            </div>

                            <div className="space-y-2">
                                <Label>Currency *</Label>
                                <Select
                                    value={form.data.currency}
                                    onValueChange={(value: 'USD' | 'GTQ') =>
                                        form.setData('currency', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((currency) => (
                                            <SelectItem
                                                key={currency.value}
                                                value={currency.value}
                                            >
                                                {currency.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.currency} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="issued_at">Issued at</Label>
                                <Input
                                    id="issued_at"
                                    type="date"
                                    value={form.data.issued_at}
                                    onChange={(event) =>
                                        form.setData('issued_at', event.target.value)
                                    }
                                />
                                <InputError message={form.errors.issued_at} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expires_at">Expires at</Label>
                                <Input
                                    id="expires_at"
                                    type="date"
                                    value={form.data.expires_at}
                                    onChange={(event) =>
                                        form.setData('expires_at', event.target.value)
                                    }
                                />
                                <InputError message={form.errors.expires_at} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notes">Internal notes</Label>
                                <Textarea
                                    id="notes"
                                    value={form.data.notes}
                                    onChange={(event) =>
                                        form.setData('notes', event.target.value)
                                    }
                                    rows={3}
                                    placeholder="Payment terms, context, or special conditions"
                                />
                                <InputError message={form.errors.notes} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Items</CardTitle>
                            <ProductPickerDialog
                                products={products}
                                onSelect={addItem}
                            />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {form.data.items.length === 0 && (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Add at least one item to build the quote.
                                </p>
                            )}

                            {form.errors.items && (
                                <InputError message={form.errors.items} />
                            )}

                            {form.data.items.map((item, index) => (
                                <div
                                    key={`${item.product_variant_id}-${index}`}
                                    className="space-y-3 rounded-lg border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {item._product_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item._variant_sku}
                                                {item._variant_summary
                                                    ? ` · ${item._variant_summary}`
                                                    : ''}
                                            </p>
                                        </div>
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
                                            <Label>Description *</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'description',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={getItemError(
                                                    index,
                                                    'description',
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Quantity *</Label>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'quantity',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={getItemError(
                                                    index,
                                                    'quantity',
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Unit price *</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'unit_price',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={getItemError(
                                                    index,
                                                    'unit_price',
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2 xl:col-span-2">
                                            <Label>Internal note</Label>
                                            <Input
                                                value={item.notes}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'notes',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Optional note per line"
                                            />
                                            <InputError
                                                message={getItemError(
                                                    index,
                                                    'notes',
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
                            {initialQuote?.quote_number && (
                                <div className="space-y-1">
                                    <Label>Quote number</Label>
                                    <Input value={initialQuote.quote_number} readOnly />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="tax_total">Tax total</Label>
                                <Input
                                    id="tax_total"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.tax_total}
                                    onChange={(event) =>
                                        form.setData('tax_total', event.target.value)
                                    }
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
                                    onChange={(event) =>
                                        form.setData(
                                            'discount_total',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.discount_total} />
                            </div>

                            <div className="space-y-2 rounded-lg border p-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Subtotal
                                    </span>
                                    <span className="font-mono">
                                        {formatCurrency(subtotal)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Tax
                                    </span>
                                    <span className="font-mono">
                                        {formatCurrency(form.data.tax_total || 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Discount
                                    </span>
                                    <span className="font-mono">
                                        {formatCurrency(form.data.discount_total || 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
                                    <span>Total</span>
                                    <span className="font-mono">
                                        {formatCurrency(total)}
                                    </span>
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
