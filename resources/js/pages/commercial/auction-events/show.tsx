import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/currency';
import {
    edit as auctionEventEdit,
    index as auctionEventsIndex,
} from '@/routes/admin/auction-events';
import { show as auctionShow } from '@/routes/admin/auctions';
import type { AuctionEvent } from '@/types';

type Props = {
    event: {
        data: AuctionEvent;
    };
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

export default function AuctionEventShow({ event: { data: event } }: Props) {
    const canEditEvent =
        (event.auctions?.length ?? 0) > 0 &&
        (event.auctions ?? []).every((auction) => auction.status === 'draft');

    return (
        <>
            <Head title={event.title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Auction Event</p>
                        <h1 className="text-2xl font-bold">{event.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            Parent event prepared to support both lot-wide and grouped item auctions.
                        </p>
                    </div>
                    {canEditEvent && (
                        <Button asChild variant="outline">
                            <Link href={auctionEventEdit({ auctionEvent: event }).url}>
                                Edit event
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className="mt-2">
                                    <Badge variant={badgeVariant(event.status)}>{event.status}</Badge>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Format</p>
                                <p className="mt-2 font-medium">{event.format.replaceAll('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Auctions</p>
                                <p className="mt-2 font-medium">{event.auctions?.length ?? event.auctions_count ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Created by</p>
                                <p className="mt-2 font-medium">{event.creator?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Starts at</p>
                                <p className="mt-2 font-medium">{new Date(event.starts_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ends at</p>
                                <p className="mt-2 font-medium">{new Date(event.ends_at).toLocaleString()}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p className="mt-2 text-sm">{event.description ?? 'No description provided.'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Child auctions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {event.auctions && event.auctions.length > 0 ? (
                                event.auctions.map((auction) => (
                                    <div key={auction.id} className="flex items-start justify-between gap-4 border p-4">
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">{auction.lot_number}</p>
                                            <h2 className="font-medium">{auction.title}</h2>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {auction.items_count ?? auction.items?.length ?? 0} item(s) · {auction.bids_count ?? 0} bid(s)
                                            </p>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Start {new Date(auction.starts_at).toLocaleString()} · End {new Date(auction.ends_at).toLocaleString()}
                                            </p>
                                            <p className="mt-2 text-sm font-medium">
                                                {formatCurrency(auction.current_bid_amount ?? auction.starting_price)}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <Badge variant={badgeVariant(auction.status)}>{auction.status}</Badge>
                                            <Link
                                                href={auctionShow({ auction }).url}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                Open auction
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No child auctions were found for this event.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AuctionEventShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Commercial', href: '#' },
            { title: 'Auction Events', href: auctionEventsIndex().url },
            { title: 'Details', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
