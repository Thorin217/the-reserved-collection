import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    SearchableSelect,
    type SearchableSelectOption,
} from '@/components/ui/searchable-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import {
    create as auctionEventsCreate,
    index as auctionEventsIndex,
    show as auctionEventShow,
} from '@/routes/admin/auction-events';
import type { AuctionEvent, PaginatedData } from '@/types';

const ALL = '__all__';

type Props = {
    events: PaginatedData<AuctionEvent>;
    filters: {
        status?: string;
        format?: string;
        search?: string;
    };
    statuses: Array<{ value: string; label: string }>;
    formats: Array<{ value: string; label: string }>;
};

function badgeVariant(
    status: AuctionEvent['status'],
): 'default' | 'secondary' | 'outline' | 'destructive' {
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

export default function AuctionEventsIndex({
    events,
    filters,
    statuses,
    formats,
}: Props) {
    const statusOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All statuses' },
        ...statuses.map((status) => ({
            value: status.value,
            label: status.label,
        })),
    ];

    const formatOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All formats' },
        ...formats.map((format) => ({
            value: format.value,
            label: format.label,
        })),
    ];

    return (
        <>
            <Head title="Auction Events" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Auction Events</h1>
                        <p className="text-sm text-muted-foreground">
                            Review parent events that group lot-wide or item-level auctions.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={auctionEventsCreate().url}>Create event</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                defaultValue={filters.search ?? ''}
                                placeholder="Search title or slug..."
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        router.get(
                                            auctionEventsIndex(),
                                            {
                                                ...filters,
                                                search: (event.target as HTMLInputElement).value,
                                            },
                                            { preserveState: true },
                                        );
                                    }
                                }}
                            />
                        </div>
                        <SearchableSelect
                            value={filters.status ?? ALL}
                            options={statusOptions}
                            placeholder="Status"
                            searchPlaceholder="Search status..."
                            onValueChange={(value) =>
                                router.get(
                                    auctionEventsIndex(),
                                    {
                                        ...filters,
                                        status: value === ALL ? undefined : value,
                                    },
                                    { preserveState: true },
                                )
                            }
                        />
                        <SearchableSelect
                            value={filters.format ?? ALL}
                            options={formatOptions}
                            placeholder="Format"
                            searchPlaceholder="Search format..."
                            onValueChange={(value) =>
                                router.get(
                                    auctionEventsIndex(),
                                    {
                                        ...filters,
                                        format: value === ALL ? undefined : value,
                                    },
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
                                    <TableHead>Title</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Auctions</TableHead>
                                    <TableHead>Starts at</TableHead>
                                    <TableHead>Ends at</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.data.length > 0 ? (
                                    events.data.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <div className="font-medium">{event.title}</div>
                                                <div className="text-xs text-muted-foreground">{event.slug}</div>
                                            </TableCell>
                                            <TableCell>{event.format.replaceAll('_', ' ')}</TableCell>
                                            <TableCell>
                                                <Badge variant={badgeVariant(event.status)}>{event.status}</Badge>
                                            </TableCell>
                                            <TableCell>{event.auctions_count ?? event.auctions?.length ?? 0}</TableCell>
                                            <TableCell>{new Date(event.starts_at).toLocaleString()}</TableCell>
                                            <TableCell>{new Date(event.ends_at).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={auctionEventShow({ auctionEvent: event }).url}
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    View event
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            No auction events found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {events.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={events.meta.current_page}
                        lastPage={events.meta.last_page}
                        onPageChange={(page) =>
                            router.get(
                                auctionEventsIndex(),
                                { ...filters, page },
                                { preserveState: true },
                            )
                        }
                    />
                )}
            </div>
        </>
    );
}

AuctionEventsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Commercial', href: '#' },
            { title: 'Auction Events', href: auctionEventsIndex().url },
        ]}
    >
        {page}
    </AppLayout>
);
