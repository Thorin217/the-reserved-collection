import { Head, Link, router } from '@inertiajs/react';
import { Ban, Eye, Pencil, Search, Square, Upload } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/components/confirmation-modal';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import {
    cancel as auctionCancel,
    close as auctionClose,
    create as auctionsCreate,
    edit as auctionEdit,
    index as auctionsIndex,
    publish as auctionPublish,
    show as auctionsShow,
} from '@/routes/admin/auctions';
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

function statusBadgeVariant(
    status: Auction['status'],
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

export default function AuctionsIndex({
    auctions,
    filters,
    statuses,
    closure_results,
    inventory_source_types,
}: Props) {
    const [pendingAction, setPendingAction] = useState<{
        type: 'publish' | 'close' | 'cancel';
        auction: Auction;
    } | null>(null);
    const statusOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All statuses' },
        ...statuses.map((status) => ({
            value: status.value,
            label: status.label,
        })),
    ];

    const closureResultOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All results' },
        ...closure_results.map((result) => ({
            value: result.value,
            label: result.label,
        })),
    ];

    const inventorySourceOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All source types' },
        ...inventory_source_types.map((sourceType) => ({
            value: sourceType.value,
            label: sourceType.label,
        })),
    ];

    function confirmPendingAction() {
        if (pendingAction === null) {
            return;
        }

        if (pendingAction.type === 'publish') {
            router.post(
                auctionPublish({ auction: pendingAction.auction }).url,
                {},
                { preserveScroll: true },
            );
        }

        if (pendingAction.type === 'cancel') {
            router.post(
                auctionCancel({ auction: pendingAction.auction }).url,
                {},
                { preserveScroll: true },
            );
        }

        if (pendingAction.type === 'close') {
            router.post(
                auctionClose({ auction: pendingAction.auction }).url,
                {},
                { preserveScroll: true },
            );
        }

        setPendingAction(null);
    }

    return (
        <>
            <Head title="Auctions" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Auctions</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage the auction lifecycle from inventory to
                            closure.
                        </p>
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
                                        router.get(
                                            auctionsIndex(),
                                            {
                                                ...filters,
                                                search: (
                                                    event.target as HTMLInputElement
                                                ).value,
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
                                    auctionsIndex(),
                                    {
                                        ...filters,
                                        status:
                                            value === ALL ? undefined : value,
                                    },
                                    { preserveState: true },
                                )
                            }
                        />
                        <SearchableSelect
                            value={filters.closure_result ?? ALL}
                            options={closureResultOptions}
                            placeholder="Result"
                            searchPlaceholder="Search result..."
                            onValueChange={(value) =>
                                router.get(
                                    auctionsIndex(),
                                    {
                                        ...filters,
                                        closure_result:
                                            value === ALL ? undefined : value,
                                    },
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
                                    {
                                        ...filters,
                                        inventory_source_type:
                                            value === ALL ? undefined : value,
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
                                    <TableHead>Lot</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Current bid</TableHead>
                                    <TableHead>Ends at</TableHead>
                                    <TableHead>Bids</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auctions.data.length > 0 ? (
                                    auctions.data.map((auction) => (
                                        <TableRow key={auction.id}>
                                            <TableCell>
                                                {auction.lot_number}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {auction.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {auction.inventory_snapshot
                                                        ?.brand_name ?? '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={statusBadgeVariant(
                                                        auction.status,
                                                    )}
                                                >
                                                    {auction.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {auction.closure_result
                                                    ? auction.closure_result.replaceAll(
                                                          '_',
                                                          ' ',
                                                      )
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {auction.inventory_source_type}
                                            </TableCell>
                                            <TableCell>
                                                {auction.current_bid_amount
                                                    ? formatCurrency(
                                                          auction.current_bid_amount,
                                                      )
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    auction.ends_at,
                                                ).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {auction.bids_count ?? 0}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="View auction"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={
                                                                        auctionsShow({
                                                                            auction,
                                                                        }).url
                                                                    }
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            View auction
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    {auction.status ===
                                                        'draft' && (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        aria-label="Edit auction"
                                                                        asChild
                                                                    >
                                                                        <Link
                                                                            href={
                                                                                auctionEdit(
                                                                                    {
                                                                                        auction,
                                                                                    },
                                                                                ).url
                                                                            }
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Link>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Edit auction
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        aria-label="Publish auction"
                                                                        onClick={() =>
                                                                            setPendingAction(
                                                                                {
                                                                                    type: 'publish',
                                                                                    auction,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <Upload className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Publish auction
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    {(auction.status ===
                                                        'scheduled' ||
                                                        auction.status ===
                                                            'live') && (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="Close auction"
                                                                    onClick={() =>
                                                                        setPendingAction(
                                                                            {
                                                                                type: 'close',
                                                                                auction,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <Square className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Close auction
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auction.status !==
                                                        'closed' &&
                                                        auction.status !==
                                                            'cancelled' && (
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-destructive hover:text-destructive"
                                                                        aria-label="Cancel auction"
                                                                        onClick={() =>
                                                                            setPendingAction(
                                                                                {
                                                                                    type: 'cancel',
                                                                                    auction,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <Ban className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    Cancel auction
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            No auctions found.
                                        </TableCell>
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
                        onPageChange={(page) =>
                            router.get(
                                auctionsIndex(),
                                { ...filters, page },
                                { preserveState: true },
                            )
                        }
                    />
                )}
            </div>

            <ConfirmationModal
                open={pendingAction !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingAction(null);
                    }
                }}
                title={
                    pendingAction?.type === 'publish'
                        ? 'Publish auction'
                        : pendingAction?.type === 'close'
                          ? 'Close auction'
                          : 'Cancel auction'
                }
                description={
                    pendingAction?.type === 'publish'
                        ? 'This will publish the auction and make it available according to its schedule.'
                        : pendingAction?.type === 'close'
                          ? 'This will close the auction immediately and lock further bidding.'
                          : 'This will cancel the auction and remove it from bidding. This action is intended for operational exceptions.'
                }
                confirmLabel={
                    pendingAction?.type === 'publish'
                        ? 'Publish auction'
                        : pendingAction?.type === 'close'
                          ? 'Close auction'
                          : 'Cancel auction'
                }
                confirmVariant={
                    pendingAction?.type === 'publish'
                        ? 'default'
                        : pendingAction?.type === 'close'
                          ? 'secondary'
                          : 'destructive'
                }
                onConfirm={confirmPendingAction}
            />
        </>
    );
}

AuctionsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Commercial', href: '#' },
            { title: 'Auctions', href: auctionsIndex().url },
        ]}
    >
        {page}
    </AppLayout>
);
