import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as QuoteController from '@/actions/App/Http/Controllers/Admin/QuoteController';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { create as createQuote, index as quotesIndex } from '@/routes/admin/finance/quotes';
import { show as saleShow } from '@/routes/admin/finance/sales';
import type { PaginatedData, Quote } from '@/types';

const ALL = '_all';

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'outline' | 'destructive';
    }
> = {
    draft: { label: 'Draft', variant: 'secondary' },
    sent: { label: 'Sent', variant: 'outline' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    expired: { label: 'Expired', variant: 'destructive' },
};

type Filters = {
    filter?: {
        search?: string;
        status?: string;
        user_id?: string;
    };
    page?: string;
};

type Props = {
    quotes: PaginatedData<Quote>;
    users: { data: Array<{ id: number; name: string }> };
    metrics: {
        draft_count: number;
        sent_count: number;
        approved_count: number;
        total_value: number;
    };
    can: {
        create: boolean;
    };
    filters: Filters;
};

export default function FinanceQuotesIndex({
    quotes,
    users,
    metrics,
    can,
    filters,
}: Props) {
    const active = filters.filter ?? {};
    const [search, setSearch] = useState(active.search ?? '');
    const [pendingDeleteQuote, setPendingDeleteQuote] = useState<Quote | null>(null);
    const [pendingConvertQuote, setPendingConvertQuote] = useState<Quote | null>(null);

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;

        router.get(
            quotesIndex(),
            { filter: { ...active, [key]: resolved } },
            { preserveState: true, replace: true },
        );
    }

    function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        applyFilter('search', search);
    }

    function confirmDeleteQuote() {
        if (!pendingDeleteQuote) {
            return;
        }

        router.delete(QuoteController.destroy.url(pendingDeleteQuote));
        setPendingDeleteQuote(null);
    }

    function confirmConvertQuote() {
        if (!pendingConvertQuote) {
            return;
        }

        router.post(QuoteController.convertToSale.url(pendingConvertQuote));
        setPendingConvertQuote(null);
    }

    return (
        <>
            <Head title="Quotes" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Quotes</h1>
                        <p className="text-sm text-muted-foreground">
                            Commercial quotes and approvals for the sales pipeline.
                        </p>
                    </div>

                    {can.create && (
                        <Button asChild size="sm">
                            <Link href={createQuote()}>
                                <Plus className="mr-2 h-4 w-4" />
                                New quote
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Drafts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {metrics.draft_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Sent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {metrics.sent_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Approved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {metrics.approved_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Quoted value
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {formatCurrency(metrics.total_value)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by quote or client..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-64"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>

                    <Select
                        value={active.status ?? ALL}
                        onValueChange={(value) => applyFilter('status', value)}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(
                                ([value, { label }]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>

                    <Select
                        value={active.user_id ?? ALL}
                        onValueChange={(value) => applyFilter('user_id', value)}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Created by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All users</SelectItem>
                            {users.data.map((user) => (
                                <SelectItem
                                    key={user.id}
                                    value={String(user.id)}
                                >
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Quote</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Lead</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Created by</TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotes.data.map((quote) => {
                                    const status =
                                        STATUS_CONFIG[quote.status] ??
                                        STATUS_CONFIG.draft;

                                    return (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-medium">
                                                {quote.quote_number}
                                            </TableCell>
                                            <TableCell>
                                                {quote.client?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {quote.lead?.title ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {quote.items_count ?? 0}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {quote.expires_at
                                                    ? new Date(
                                                          quote.expires_at,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {quote.user?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(quote.total)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    {quote.can?.update && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={QuoteController.edit.url(
                                                                    quote,
                                                                )}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    {quote.linked_sale_id ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="View sale"
                                                            asChild
                                                        >
                                                            <Link href={saleShow(quote.linked_sale_id)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        quote.can?.convert_to_sale && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Convert to sale"
                                                                onClick={() => setPendingConvertQuote(quote)}
                                                            >
                                                                <ShoppingCart className="h-4 w-4" />
                                                            </Button>
                                                        )
                                                    )}

                                                    {quote.can?.delete ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                setPendingDeleteQuote(
                                                                    quote,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled
                                                            title="Quotes with related sales cannot be deleted"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {quotes.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No quotes found yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {quotes.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={quotes.meta.current_page}
                        lastPage={quotes.meta.last_page}
                        onPageChange={(page) =>
                            router.get(
                                quotesIndex(),
                                { filter: active, page: String(page) },
                                { preserveState: true, replace: true },
                            )
                        }
                    />
                )}
            </div>

            <ConfirmationModal
                open={!!pendingDeleteQuote}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDeleteQuote(null);
                    }
                }}
                title="Delete quote"
                description={pendingDeleteQuote
                    ? `You are about to delete ${pendingDeleteQuote.quote_number}. This action removes the quote and all its lines permanently.`
                    : 'You are about to delete this quote permanently.'}
                confirmLabel="Delete quote"
                confirmVariant="destructive"
                onConfirm={confirmDeleteQuote}
            />

            <ConfirmationModal
                open={!!pendingConvertQuote}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingConvertQuote(null);
                    }
                }}
                title="Convert quote to sale"
                description={pendingConvertQuote
                    ? `You are about to convert ${pendingConvertQuote.quote_number} into a sale draft.`
                    : 'You are about to convert this quote into a sale draft.'}
                confirmLabel="Convert to sale"
                onConfirm={confirmConvertQuote}
            />
        </>
    );
}

FinanceQuotesIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Quotes', href: quotesIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
