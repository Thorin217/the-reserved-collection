import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndex } from '@/routes/admin/products';
import type { Attribute } from '@/types';

const PRODUCT_PRICE_UPDATES_URL = '/admin/products/price-updates';
const PRODUCT_PRICE_UPDATES_PREVIEW_URL = '/admin/products/price-updates/preview';
const PRODUCT_PRICE_UPDATES_STORE_URL = '/admin/products/price-updates';
const PRODUCT_PRICE_UPDATES_HISTORY_URL = '/admin/products/price-updates/history';
const EMPTY_VALUE = '__none__';

type Filter = {
    attribute_id: number | null;
    attribute_option_id: number | null;
};

type PreviewVariant = {
    id: number;
    product_id: number;
    product_name: string | null;
    product_sku: string | null;
    sku: string;
    price: string | null;
};

type Props = {
    attributes: { data: Attribute[] };
    filters: Filter[];
    preview: {
        total_variants: number;
        variants: PreviewVariant[];
    };
    execution?: {
        applied: boolean;
        affected_variants_count: number;
        change_value: number;
    } | null;
    recentFluctuations: Array<{
        id: number;
        name: string | null;
        change_type: string;
        change_value: string;
        affected_variants_count: number;
        items_count: number;
        created_at: string;
        creator_name: string | null;
        affected_products_count: number;
        affected_products: string[];
    }>;
};

function toFilterInput(filter: Filter): Filter {
    return {
        attribute_id: filter.attribute_id ?? null,
        attribute_option_id: filter.attribute_option_id ?? null,
    };
}

function emptyFilter(): Filter {
    return {
        attribute_id: null,
        attribute_option_id: null,
    };
}

function formatCurrency(value: string | null): string {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-GT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function ProductPriceUpdatesIndex({ attributes, filters, preview, execution, recentFluctuations }: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [selectedFilters, setSelectedFilters] = useState<Filter[]>(
        filters.length > 0 ? filters.map(toFilterInput) : [emptyFilter()],
    );
    const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
    const [changeValue, setChangeValue] = useState('0');

    const attributesById = useMemo(() => new Map(attributes.data.map(attribute => [attribute.id, attribute])), [attributes.data]);
    const variantIds = useMemo(() => preview.variants.map(variant => variant.id), [preview.variants]);

    const canSubmitPreview = selectedFilters.some(filter => filter.attribute_id !== null);
    const parsedChangeValue = Number(changeValue);
    const isValidChangeValue = Number.isFinite(parsedChangeValue) && Math.abs(parsedChangeValue) > 0;
    const canApplyUpdate = selectedVariantIds.length > 0 && isValidChangeValue;
    const allSelected = variantIds.length > 0 && selectedVariantIds.length === variantIds.length;
    const latestFluctuations = useMemo(() => recentFluctuations.slice(0, 3), [recentFluctuations]);

    function addFilter() {
        setSelectedFilters(previous => [...previous, emptyFilter()]);
    }

    function removeFilter(index: number) {
        setSelectedFilters(previous => {
            const next = previous.filter((_, currentIndex) => currentIndex !== index);

            return next.length > 0 ? next : [emptyFilter()];
        });
    }

    function updateFilterAttribute(index: number, attributeId: string) {
        if (attributeId === EMPTY_VALUE) {
            setSelectedFilters(previous => previous.map((filter, currentIndex) => {
                if (currentIndex !== index) {
                    return filter;
                }

                return emptyFilter();
            }));

            return;
        }

        setSelectedFilters(previous => previous.map((filter, currentIndex) => {
            if (currentIndex !== index) {
                return filter;
            }

            return {
                attribute_id: Number(attributeId),
                attribute_option_id: null,
            };
        }));
    }

    function updateFilterOption(index: number, optionId: string) {
        setSelectedFilters(previous => previous.map((filter, currentIndex) => {
            if (currentIndex !== index) {
                return filter;
            }

            return {
                ...filter,
                attribute_option_id: optionId === EMPTY_VALUE ? null : Number(optionId),
            };
        }));
    }

    function submitPreview(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSelectedVariantIds([]);

        const payloadFilters = selectedFilters
            .filter(filter => filter.attribute_id !== null)
            .map(filter => ({
                attribute_id: filter.attribute_id,
                attribute_option_id: filter.attribute_option_id,
            }));

        if (payloadFilters.length === 0) {
            return;
        }

        router.post(
            PRODUCT_PRICE_UPDATES_PREVIEW_URL,
            { filters: payloadFilters },
            { preserveScroll: true },
        );
    }

    function clearPreview() {
        setSelectedFilters([emptyFilter()]);
        setSelectedVariantIds([]);
        router.get(PRODUCT_PRICE_UPDATES_URL, {}, { preserveScroll: true });
    }

    function toggleVariant(variantId: number, checked: boolean) {
        setSelectedVariantIds(previous => checked
            ? [...new Set([...previous, variantId])]
            : previous.filter(currentId => currentId !== variantId));
    }

    function toggleAllVariants(checked: boolean) {
        setSelectedVariantIds(checked ? variantIds : []);
    }

    function applyUpdate() {
        const payloadFilters = selectedFilters
            .filter(filter => filter.attribute_id !== null)
            .map(filter => ({
                attribute_id: filter.attribute_id,
                attribute_option_id: filter.attribute_option_id,
            }));

        if (payloadFilters.length === 0 || selectedVariantIds.length === 0) {
            return;
        }

        router.post(PRODUCT_PRICE_UPDATES_STORE_URL, {
            name: 'Bulk update',
            change_type: 'percentage',
            change_value: Number(changeValue),
            filters: payloadFilters,
            variant_ids: selectedVariantIds,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedVariantIds([]);
            },
        });
    }

    return (
        <>
            <Head title="Update Products" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Update Products</h1>
                    <p className="text-sm text-muted-foreground">
                        Bulk price updates by product attributes
                    </p>
                    <Link href={PRODUCT_PRICE_UPDATES_HISTORY_URL} className="text-sm text-primary underline">
                        View history
                    </Link>
                </div>

                <Card className="hidden lg:block">
                    <CardHeader>
                        <CardTitle>Recent price fluctuations</CardTitle>
                        <CardDescription>
                            Quick audit context for the most recent updates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {latestFluctuations.length === 0 && (
                            <p className="text-sm text-muted-foreground">No previous price fluctuations recorded yet.</p>
                        )}

                        <div className="grid gap-3 lg:grid-cols-3">
                            {latestFluctuations.map((fluctuation) => (
                                <div key={fluctuation.id} className="rounded-md border p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-medium">
                                            {fluctuation.name ?? 'Bulk update'}
                                            {' '}
                                            <span className={`text-sm ${Number(fluctuation.change_value) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                ({Number(fluctuation.change_value) > 0 ? '+' : ''}{fluctuation.change_value}%)
                                            </span>
                                        </p>
                                        <Link href={`${PRODUCT_PRICE_UPDATES_HISTORY_URL}/${fluctuation.id}`} className="text-sm text-primary underline">
                                            View detail
                                        </Link>
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {fluctuation.affected_variants_count} variants • {fluctuation.affected_products_count} products • by {fluctuation.creator_name ?? 'System'} • {formatDate(fluctuation.created_at)}
                                    </p>

                                    {fluctuation.affected_products.length > 0 && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Affected products: {fluctuation.affected_products.join(', ')}
                                            {fluctuation.affected_products_count > fluctuation.affected_products.length && '...'}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Filter by product-level attributes. Option is optional.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitPreview} className="space-y-3">
                            {selectedFilters.map((filter, index) => {
                                const selectedAttribute = filter.attribute_id ? attributesById.get(filter.attribute_id) : null;
                                const options = selectedAttribute?.attribute_options ?? [];
                                const attributeOptions: SearchableSelectOption[] = [
                                    { value: EMPTY_VALUE, label: 'Select attribute' },
                                    ...attributes.data.map(attribute => ({
                                        value: String(attribute.id),
                                        label: attribute.name,
                                        keywords: `${attribute.code} ${attribute.name}`,
                                    })),
                                ];
                                const optionOptions: SearchableSelectOption[] = [
                                    { value: EMPTY_VALUE, label: 'Any option' },
                                    ...options.map(option => ({
                                        value: String(option.id),
                                        label: option.label ?? option.value,
                                        keywords: `${option.value} ${option.label ?? ''}`,
                                    })),
                                ];

                                return (
                                    <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                                        <SearchableSelect
                                            value={filter.attribute_id ? String(filter.attribute_id) : EMPTY_VALUE}
                                            onValueChange={value => updateFilterAttribute(index, value)}
                                            options={attributeOptions}
                                            placeholder="Select attribute"
                                            searchPlaceholder="Search attributes..."
                                        />

                                        <SearchableSelect
                                            value={filter.attribute_option_id === null ? EMPTY_VALUE : String(filter.attribute_option_id)}
                                            onValueChange={value => updateFilterOption(index, value)}
                                            options={optionOptions}
                                            placeholder="Any option"
                                            searchPlaceholder="Search options..."
                                            disabled={!selectedAttribute}
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeFilter(index)}
                                            aria-label="Remove filter"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={addFilter}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add filter
                                </Button>

                                <Button type="submit" disabled={!canSubmitPreview}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Preview variants
                                </Button>

                                <Button type="button" variant="ghost" onClick={clearPreview}>
                                    Clear
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>
                            {preview.total_variants} candidate variants found.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
                            <p className="text-muted-foreground">
                                Selected variants: <span className="font-medium text-foreground">{selectedVariantIds.length}</span>
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleAllVariants(true)}
                                    disabled={variantIds.length === 0 || allSelected}
                                >
                                    Select all
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedVariantIds([])}
                                    disabled={selectedVariantIds.length === 0}
                                >
                                    Clear selection
                                </Button>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={variantIds.length > 0 && selectedVariantIds.length === variantIds.length}
                                            onCheckedChange={checked => toggleAllVariants(Boolean(checked))}
                                        />
                                    </TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Product SKU</TableHead>
                                    <TableHead>Variant SKU</TableHead>
                                    <TableHead className="text-right">Current price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {preview.variants.map((variant) => (
                                    <TableRow key={variant.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedVariantIds.includes(variant.id)}
                                                onCheckedChange={checked => toggleVariant(variant.id, Boolean(checked))}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{variant.product_name ?? '—'}</TableCell>
                                        <TableCell className="font-mono text-xs">{variant.product_sku ?? '—'}</TableCell>
                                        <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(variant.price)}</TableCell>
                                    </TableRow>
                                ))}

                                {preview.variants.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                            No candidate variants yet. Add filters and run preview.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Apply update</CardTitle>
                        <CardDescription>
                            Apply percentage update to selected variants.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-[220px_auto] md:items-end">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Percentage</p>
                            <Input
                                type="number"
                                step="0.01"
                                value={changeValue}
                                onChange={event => setChangeValue(event.target.value)}
                                placeholder="Example: 5 or -2.5"
                            />
                            {errors.change_value && (
                                <p className="text-xs text-destructive">{errors.change_value}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={applyUpdate} disabled={!canApplyUpdate}>
                                Apply to {selectedVariantIds.length} variants
                            </Button>

                            {!isValidChangeValue && (
                                <p className="text-xs text-muted-foreground">Enter a non-zero percentage value.</p>
                            )}

                            {errors.variant_ids && (
                                <p className="text-xs text-destructive">{errors.variant_ids}</p>
                            )}

                            {execution?.applied && (
                                <p className="text-sm text-muted-foreground">
                                    Last execution applied {execution.change_value}% to {execution.affected_variants_count} variants successfully.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ProductPriceUpdatesIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Products', href: productsIndex() },
            { title: 'Update Products', href: PRODUCT_PRICE_UPDATES_URL },
        ]}
    >
        {page}
    </AppLayout>
);
