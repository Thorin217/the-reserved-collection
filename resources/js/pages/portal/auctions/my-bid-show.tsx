import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Gavel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { auctionHouse } from '@/routes/portal';
import { auctions as profileAuctions } from '@/routes/portal/profile';
import type { Auction } from '@/types';

type Props = {
    auction: {
        data: Auction;
    };
};

function outcomeLabel(auction: Auction): string {
    if (auction.participation_result === 'won') {
        return 'Won';
    }

    if (auction.participation_result === 'lost') {
        return 'Lost';
    }

    if (auction.participation_result === 'reserve_not_met') {
        return 'Reserve not met';
    }

    if (auction.participation_result === 'leading') {
        return 'Leading';
    }

    if (auction.participation_result === 'outbid') {
        return 'Outbid';
    }

    if (auction.participation_result === 'scheduled') {
        return 'Scheduled';
    }

    return 'In progress';
}

function outcomeClasses(auction: Auction): string {
    if (auction.participation_result === 'won') {
        return 'border-green-500/30 bg-green-500/10 text-green-100';
    }

    if (auction.participation_result === 'reserve_not_met') {
        return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
    }

    if (auction.participation_result === 'lost' || auction.participation_result === 'outbid') {
        return 'border-white/10 bg-white/5 text-foreground/80';
    }

    if (auction.participation_result === 'leading') {
        return 'border-red-500/40 bg-red-500/12 text-red-200';
    }

    return 'border-gold/30 bg-gold/10 text-gold';
}

function participationMessage(auction: Auction): string {
    if (auction.participation_result === 'won') {
        return `Congratulations. Your winning bid is ${formatCurrency(auction.hammer_price ?? auction.current_bid_amount ?? auction.starting_price)}.`;
    }

    if (auction.participation_result === 'lost') {
        return 'This auction has closed and another bidder placed the highest valid bid.';
    }

    if (auction.participation_result === 'reserve_not_met') {
        return 'The auction closed without meeting the reserve, so no winner was assigned.';
    }

    if (auction.participation_result === 'leading') {
        return 'You currently hold the highest bid on this auction.';
    }

    if (auction.participation_result === 'outbid') {
        return 'You participated in this auction, but another bidder is currently ahead.';
    }

    if (auction.participation_result === 'scheduled') {
        return 'This auction is scheduled and your participation is already recorded.';
    }

    return 'This is your participation record for the selected auction.';
}

export default function MyAuctionBidShow({ auction: { data: auction } }: Props) {
    return (
        <>
            <Head title={`${auction.title} — My Auctions`} />
            <div className="py-8">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] tracking-[0.25em] text-gold uppercase">My Auctions</p>
                            <h1 className="mt-2 font-display text-3xl text-foreground">{auction.title}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Review your participation record and the outcome of this auction.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={profileAuctions().url}
                                className="inline-flex items-center gap-2 border border-border bg-card px-5 py-3 text-[11px] tracking-[0.2em] text-foreground/75 uppercase transition-colors hover:border-gold/30 hover:text-gold"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to My Auctions
                            </Link>
                            <Link
                                href={auctionHouse({ query: { auction: auction.slug, view: 'auction' } }).url}
                                className="inline-flex items-center gap-2 border border-border bg-card px-5 py-3 text-[11px] tracking-[0.2em] text-foreground/75 uppercase transition-colors hover:border-gold/30 hover:text-gold"
                            >
                                <Gavel className="h-4 w-4" />
                                Open in Auction House
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="space-y-5 p-6">
                                    <div className="aspect-[4/3] overflow-hidden bg-secondary">
                                        {auction.inventory_snapshot?.image_url ? (
                                            <img
                                                src={auction.inventory_snapshot.image_url}
                                                alt={auction.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-muted-foreground">No image available</div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <p className="text-[10px] tracking-[0.22em] text-gold uppercase">{auction.lot_number}</p>
                                        <span className={`rounded-full border px-2 py-1 text-[10px] tracking-[0.16em] uppercase ${outcomeClasses(auction)}`}>
                                            {outcomeLabel(auction)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {auction.inventory_snapshot?.brand_name ?? 'Auction'} · {auction.inventory_snapshot?.attribute_summary ?? 'No additional specification available.'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Participation result</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`border p-4 ${outcomeClasses(auction)}`}>
                                        <p className="text-[10px] tracking-[0.18em] uppercase">Status</p>
                                        <h2 className="mt-2 font-display text-2xl">{outcomeLabel(auction)}</h2>
                                        <p className="mt-3 text-sm opacity-90">{participationMessage(auction)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your activity</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Your bids</p>
                                        <p className="mt-2 font-display text-3xl text-foreground">{auction.user_bid_count ?? 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Your max bid</p>
                                        <p className="mt-2 font-display text-3xl text-foreground">
                                            {auction.user_max_bid_amount ? formatCurrency(auction.user_max_bid_amount) : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Current / final</p>
                                        <p className="mt-2 text-lg text-foreground/80">
                                            {formatCurrency(auction.hammer_price ?? auction.current_bid_amount ?? auction.starting_price)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Auction status</p>
                                        <p className="mt-2 text-lg text-foreground/80">{auction.status}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Bid history</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {auction.bids && auction.bids.length > 0 ? auction.bids.map((bid) => (
                                        <div key={bid.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">{bid.user?.name ?? `Bidder #${bid.user_id}`}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{new Date(bid.placed_at).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gold">{formatCurrency(bid.amount)}</p>
                                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-foreground/45">
                                                    {bid.is_winning ? 'Winning' : 'Recorded'}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-muted-foreground">No bids recorded for this auction.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

MyAuctionBidShow.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
