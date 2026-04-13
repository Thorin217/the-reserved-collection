import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useState } from 'react';
import TablePagination from '@/components/table-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as productsIndex } from '@/routes/admin/products';

type HistoryItem = {
    id: number;
    name: string | null;
    change_type: string;
    change_value: string;
    affected_variants_count: number;
    items_count: number;
    creator_name: string | null;
    created_at: string;
};

type Props = {
    history: {
        data: HistoryItem[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
            from: number | null;
            to: number | null;
        };
    };
    filters: {
        search?: string;
    };
};

const PRICE_UPDATES_URL = '/admin/products/price-updates';
const PRICE_UPDATES_HISTORY_URL = '/admin/products/price-updates/history';

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-GT', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function ProductPriceUpdatesHistoryIndex({ history, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilters(payload: { search?: string; page?: string }) {
        router.get(PRICE_UPDATES_HISTORY_URL, payload, { preserveState: true, replace: true });
    }

    function submitSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        applyFilters({ search });
    }

    return (
        <>
            <Head title="Price Updates History" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Price Updates History</h1>
                        <p className="text-sm text-muted-foreground">{history.meta.total} executions registered</p>
                    </div>

                    <Button asChild variant="outline">
                        <Link href={PRICE_UPDATES_URL}>Back to updates</Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={submitSearch} className="flex gap-2">
                            <Input
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="Search by name"
                                className="max-w-sm"
                            />
                            <Button type="submit" variant="outline" size="icon" aria-label="Search history">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Change %</TableHead>
                                    <TableHead className="text-right">Affected variants</TableHead>
                                    <TableHead className="text-right">Updated rows</TableHead>
                                    <TableHead>Created by</TableHead>
                                    <TableHead>Created at</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.data.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>#{entry.id}</TableCell>
                                        <TableCell>{entry.name ?? 'Bulk update'}</TableCell>
                                        <TableCell className="text-right">{entry.change_value}%</TableCell>
                                        <TableCell className="text-right">{entry.affected_variants_count}</TableCell>
                                        <TableCell className="text-right">{entry.items_count}</TableCell>
                                        <TableCell>{entry.creator_name ?? 'System'}</TableCell>
                                        <TableCell>{formatDate(entry.created_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="ghost" size="icon">
                                                <Link href={`${PRICE_UPDATES_HISTORY_URL}/${entry.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {history.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No history records found for the current filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {history.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={history.meta.current_page}
                        lastPage={history.meta.last_page}
                        onPageChange={(page) => applyFilters({ ...filters, page: String(page) })}
                    />
                )}
            </div>
        </>
    );
}

ProductPriceUpdatesHistoryIndex.layout = (page: React.ReactNode) => (
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
