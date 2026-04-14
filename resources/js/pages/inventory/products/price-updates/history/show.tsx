import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    formatCurrency as formatMoney,
    formatSignedCurrency as formatSignedMoney,
} from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndex } from '@/routes/admin/products';

type PriceUpdateDetail = {
    id: number;
    name: string | null;
    notes: string | null;
    change_type: string;
    change_value: string;
    affected_variants_count: number;
    creator_name: string | null;
    created_at: string;
    filters: Array<{
        id: number;
        entity_level: string;
        attribute: {
            id: number | null;
            name: string | null;
            code: string | null;
        };
        attribute_option: {
            id: number;
            label: string | null;
            value: string;
        } | null;
    }>;
    items: Array<{
        id: number;
        old_price: string;
        new_price: string;
        delta_price: string;
        product: {
            id: number | null;
            name: string | null;
            sku: string | null;
        };
        variant: {
            id: number | null;
            sku: string | null;
        };
    }>;
};

type Props = {
    priceUpdate?: PriceUpdateDetail;
    price_update?: PriceUpdateDetail;
};

const PRICE_UPDATES_URL = '/admin/products/price-updates';
const PRICE_UPDATES_HISTORY_URL = '/admin/products/price-updates/history';

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-GT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatCurrency(value: string): string {
    return formatMoney(value, { currency: 'GTQ', mantissa: 2 });
}

function formatSignedCurrency(value: string): string {
    return formatSignedMoney(value, { currency: 'GTQ', mantissa: 2 });
}

export default function ProductPriceUpdatesHistoryShow({
    priceUpdate,
    price_update,
}: Props) {
    const detail = priceUpdate ?? price_update;

    if (!detail) {
        return (
            <>
                <Head title="Price Update" />
                <div className="flex h-full flex-1 items-center justify-center p-4 text-muted-foreground">
                    Price update details are unavailable.
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Price Update #${detail.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Price Update #{detail.id}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Created at {formatDate(detail.created_at)}
                        </p>
                    </div>

                    <Link
                        href={PRICE_UPDATES_HISTORY_URL}
                        className="text-sm text-primary underline"
                    >
                        Back to history
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                        <p>
                            <span className="font-medium">Name:</span>{' '}
                            {detail.name ?? 'Bulk update'}
                        </p>
                        <p>
                            <span className="font-medium">Change:</span>{' '}
                            {detail.change_value}% ({detail.change_type})
                        </p>
                        <p>
                            <span className="font-medium">
                                Affected variants:
                            </span>{' '}
                            {detail.affected_variants_count}
                        </p>
                        <p>
                            <span className="font-medium">Created by:</span>{' '}
                            {detail.creator_name ?? 'System'}
                        </p>
                        <p className="md:col-span-2">
                            <span className="font-medium">Notes:</span>{' '}
                            {detail.notes ?? '—'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Applied filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {detail.filters.map((filter) => (
                            <p key={filter.id}>
                                <span className="font-medium">
                                    {filter.attribute.name ?? 'Attribute'}
                                </span>{' '}
                                ({filter.attribute.code ?? '—'}){' · '}
                                {filter.attribute_option
                                    ? (filter.attribute_option.label ??
                                      filter.attribute_option.value)
                                    : 'Any option'}
                            </p>
                        ))}

                        {detail.filters.length === 0 && (
                            <p className="text-muted-foreground">
                                No filters stored.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Updated variants</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Product SKU</TableHead>
                                    <TableHead>Variant SKU</TableHead>
                                    <TableHead className="text-right">
                                        Old price
                                    </TableHead>
                                    <TableHead className="text-right">
                                        New price
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Delta
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detail.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {item.product.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {item.product.sku ?? '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {item.variant.sku ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.old_price)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.new_price)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right ${Number(item.delta_price) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                                        >
                                            {formatSignedCurrency(
                                                item.delta_price,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {detail.items.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No updated variants found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ProductPriceUpdatesHistoryShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Inventory', href: '#' },
            { title: 'Products', href: productsIndex() },
            { title: 'Price Updates', href: PRICE_UPDATES_URL },
            { title: 'History', href: PRICE_UPDATES_HISTORY_URL },
        ]}
    >
        {page}
    </AppLayout>
);
