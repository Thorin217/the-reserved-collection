import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    SearchableSelect,
    type SearchableSelectOption,
} from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { create as auctionsCreate, index as auctionsIndex, show as auctionsShow } from '@/routes/admin/auctions';
import type { Auction, PaginatedData } from '@/types';

const ALL = '__all__';

type Props = {
    auctions: PaginatedData<Auction>;
    filters: {
        status?: string;
        closure_result?: string;
        inventory_source_type?: string;
        search?: string;
    };
    statuses: Array<{ value: string; label: string }>;
    closure_results: Array<{ value: string; label: string }>;
    inventory_source_types: Array<{ value: string; label: string }>;
};

function statusBadgeVariant(status: Auction['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
    if (status === 'live') {
        return 'default';
    }

    if (status === 'cancelled') {
        return 'destructive';
    }

    if (status === 'closed') {
        return 'secondary';
    }

    return 'outline';
}

export default function AuctionsIndex({ auctions, filters, statuses, closure_results, inventory_source_types }: Props) {
    const statusOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All statuses' },
        ...statuses.map((status) => ({ value: status.value, label: status.label })),
    ];

    const closureResultOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All results' },
        ...closure_results.map((result) => ({ value: result.value, label: result.label })),
    ];

    const inventorySourceOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All source types' },
        ...inventory_source_types.map((sourceType) => ({
            value: sourceType.value,
            label: sourceType.label,
        })),
    ];

    return (
        <>
            <Head title="Auctions" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Auctions</h1>
                        <p className="text-sm text-muted-foreground">Manage the auction lifecycle from inventory to closure.</p>
                    </div>
                    <Button asChild>
                        <Link href={auctionsCreate()}>Create auction</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                defaultValue={filters.search ?? ''}
                                placeholder="Search title or lot..."
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        router.get(auctionsIndex(), { ...filters, search: (event.target as HTMLInputElement).value }, { preserveState: true });
                                    }
                                }}
                            />
                        </div>
                        <SearchableSelect
                            value={filters.status ?? ALL}
                            options={statusOptions}
                            placeholder="Status"
                            searchPlaceholder="Search status..."
                            onValueChange={(value) => router.get(auctionsIndex(), { ...filters, status: value === ALL ? undefined : value }, { preserveState: true })}
                        />
                        <SearchableSelect
                            value={filters.closure_result ?? ALL}
                            options={closureResultOptions}
                            placeholder="Result"
                            searchPlaceholder="Search result..."
                            onValueChange={(value) =>
                                router.get(
                                    auctionsIndex(),
                                    { ...filters, closure_result: value === ALL ? undefined : value },
                                    { preserveState: true },
                                )
                            }
                        />
                        <SearchableSelect
                            value={filters.inventory_source_type ?? ALL}
                            options={inventorySourceOptions}
                            placeholder="Source type"
                            searchPlaceholder="Search source type..."
                            onValueChange={(value) =>
                                router.get(
                                    auctionsIndex(),
                                    { ...filters, inventory_source_type: value === ALL ? undefined : value },
                                    { preserveState: true },
                                )
                            }
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lot</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Current bid</TableHead>
                                    <TableHead>Ends at</TableHead>
                                    <TableHead>Bids</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auctions.data.length > 0 ? auctions.data.map((auction) => (
                                    <TableRow key={auction.id} className="cursor-pointer" onClick={() => router.visit(auctionsShow({ auction }))}>
                                        <TableCell>{auction.lot_number}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{auction.title}</div>
                                            <div className="text-xs text-muted-foreground">{auction.inventory_snapshot?.brand_name ?? '—'}</div>
                                        </TableCell>
                                        <TableCell><Badge variant={statusBadgeVariant(auction.status)}>{auction.status}</Badge></TableCell>
                                        <TableCell>{auction.closure_result ? auction.closure_result.replaceAll('_', ' ') : '—'}</TableCell>
                                        <TableCell>{auction.inventory_source_type}</TableCell>
                                        <TableCell>{auction.current_bid_amount ? formatCurrency(auction.current_bid_amount) : '—'}</TableCell>
                                        <TableCell>{new Date(auction.ends_at).toLocaleString()}</TableCell>
                                        <TableCell>{auction.bids_count ?? 0}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No auctions found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {auctions.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={auctions.meta.current_page}
                        lastPage={auctions.meta.last_page}
                        onPageChange={(page) => router.get(auctionsIndex(), { ...filters, page }, { preserveState: true })}
                    />
                )}
            </div>
        </>
    );
}

AuctionsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Commercial', href: '#' }, { title: 'Auctions', href: auctionsIndex().url }]}>
        {page}
    </AppLayout>
);
