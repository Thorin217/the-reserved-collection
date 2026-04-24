import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmationModal from '@/components/confirmation-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { close as auctionClose, index as auctionsIndex, publish as auctionPublish, cancel as auctionCancel } from '@/routes/admin/auctions';
import type { Auction } from '@/types';

type Props = {
    auction: {
        data: Auction;
    };
};

type PendingAction = 'publish' | 'close' | 'cancel' | null;

export default function AuctionsShow({ auction: { data: auction } }: Props) {
    const snapshot = auction.inventory_snapshot ?? {};
    const winnerLabel = auction.winner?.name ?? 'No winner';
    const currentBidderLabel = auction.current_bid_user?.name ?? 'No bids yet';
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    function confirmPendingAction() {
        if (pendingAction === null) {
            return;
        }

        if (pendingAction === 'publish') {
            router.post(auctionPublish({ auction }).url);
        }

        if (pendingAction === 'close') {
            router.post(auctionClose({ auction }).url);
        }

        if (pendingAction === 'cancel') {
            router.post(auctionCancel({ auction }).url);
        }

        setPendingAction(null);
    }

    function confirmationConfig() {
        if (pendingAction === 'publish') {
            return {
                title: 'Publish auction',
                description: 'This will publish the auction and make it available according to its schedule.',
                confirmLabel: 'Publish auction',
                confirmVariant: 'default' as const,
            };
        }

        if (pendingAction === 'close') {
            return {
                title: 'Close auction',
                description: 'This will close the auction now and resolve the winner using the highest valid bid.',
                confirmLabel: 'Close auction',
                confirmVariant: 'outline' as const,
            };
        }

        return {
            title: 'Cancel auction',
            description: 'This will cancel the auction and remove it from bidding. This action is intended for operational exceptions.',
            confirmLabel: 'Cancel auction',
            confirmVariant: 'destructive' as const,
        };
    }

    return (
        <>
            <Head title={auction.title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{auction.title}</h1>
                        <p className="text-sm text-muted-foreground">{auction.lot_number}</p>
                    </div>
                    <div className="flex gap-2">
                        {auction.status === 'draft' && (
                            <Button onClick={() => setPendingAction('publish')}>Publish</Button>
                        )}
                        {(auction.status === 'scheduled' || auction.status === 'live') && (
                            <>
                                <Button variant="outline" onClick={() => setPendingAction('close')}>Close</Button>
                                <Button variant="destructive" onClick={() => setPendingAction('cancel')}>Cancel</Button>
                            </>
                        )}
                        {auction.status === 'draft' && (
                            <Button variant="destructive" onClick={() => setPendingAction('cancel')}>Cancel</Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Auction summary</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div><div className="text-xs text-muted-foreground">Status</div><Badge variant="outline">{auction.status}</Badge></div>
                            <div><div className="text-xs text-muted-foreground">Result</div><div>{auction.closure_result ?? '—'}</div></div>
                            <div><div className="text-xs text-muted-foreground">Source type</div><div className="capitalize">{auction.inventory_source_type}</div></div>
                            <div><div className="text-xs text-muted-foreground">Minimum next bid</div><div>{formatCurrency(auction.minimum_allowed_bid)}</div></div>
                            <div><div className="text-xs text-muted-foreground">Starting price</div><div>{formatCurrency(auction.starting_price)}</div></div>
                            <div><div className="text-xs text-muted-foreground">Current bid</div><div>{auction.current_bid_amount ? formatCurrency(auction.current_bid_amount) : '—'}</div></div>
                            <div><div className="text-xs text-muted-foreground">Reserve</div><div>{auction.reserve_price ? formatCurrency(auction.reserve_price) : '—'}</div></div>
                            <div><div className="text-xs text-muted-foreground">Hammer price</div><div>{auction.hammer_price ? formatCurrency(auction.hammer_price) : '—'}</div></div>
                            <div><div className="text-xs text-muted-foreground">Current highest bidder</div><div>{currentBidderLabel}</div></div>
                            <div><div className="text-xs text-muted-foreground">Winner</div><div>{winnerLabel}</div></div>
                            <div><div className="text-xs text-muted-foreground">Starts</div><div>{new Date(auction.starts_at).toLocaleString()}</div></div>
                            <div><div className="text-xs text-muted-foreground">Ends</div><div>{new Date(auction.ends_at).toLocaleString()}</div></div>
                            <div><div className="text-xs text-muted-foreground">Created by</div><div>{auction.creator?.name ?? '—'}</div></div>
                            <div><div className="text-xs text-muted-foreground">Closed by</div><div>{auction.closer?.name ?? '—'}</div></div>
                            <div><div className="text-xs text-muted-foreground">Closed at</div><div>{auction.closed_at ? new Date(auction.closed_at).toLocaleString() : '—'}</div></div>
                            <div><div className="text-xs text-muted-foreground">Closure mode</div><div>{auction.is_manually_closed ? 'Manual' : 'Automatic / pending'}</div></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Inventory snapshot</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="font-medium">{snapshot.product_name ?? '—'}</div>
                            <div className="text-muted-foreground">{snapshot.brand_name ?? '—'}</div>
                            <div className="text-muted-foreground">Attributes: {snapshot.attribute_summary ?? '—'}</div>
                            <div className="text-muted-foreground">Variant: {snapshot.variant_sku ?? '—'}</div>
                            <div className="text-muted-foreground">Serial: {snapshot.serial_number ?? '—'}</div>
                            <div className="text-muted-foreground">Reference price: {snapshot.price_reference ? formatCurrency(snapshot.price_reference) : '—'}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Bid history</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bidder</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Placed at</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auction.bids && auction.bids.length > 0 ? auction.bids.map((bid) => (
                                    <TableRow key={bid.id}>
                                        <TableCell>{bid.user?.name ?? '—'}</TableCell>
                                        <TableCell>{formatCurrency(bid.amount)}</TableCell>
                                        <TableCell>{new Date(bid.placed_at).toLocaleString()}</TableCell>
                                        <TableCell>{bid.is_winning ? 'Winning' : 'Recorded'}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No bids yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <ConfirmationModal
                open={pendingAction !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingAction(null);
                    }
                }}
                title={confirmationConfig().title}
                description={confirmationConfig().description}
                confirmLabel={confirmationConfig().confirmLabel}
                confirmVariant={confirmationConfig().confirmVariant}
                onConfirm={confirmPendingAction}
            />
        </>
    );
}

AuctionsShow.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Commercial', href: '#' }, { title: 'Auctions', href: auctionsIndex().url }, { title: 'Details', href: '#' }]}>
        {page}
    </AppLayout>
);
