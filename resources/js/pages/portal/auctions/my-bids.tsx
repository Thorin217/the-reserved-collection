import { Head, Link } from '@inertiajs/react';
import { Gavel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import PortalLayout from '@/layouts/portal-layout';
import { auctionHouse } from '@/routes/portal';
import { show as showMyAuction } from '@/routes/portal/profile';
import type { Auction, PaginatedData } from '@/types';

type Props = {
    auctions: PaginatedData<Auction>;
};

export default function MyAuctionBids({ auctions }: Props) {
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

    return (
        <>
            <Head title="My Auctions" />
            <div className="py-8">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] tracking-[0.25em] text-gold uppercase">My Auctions</p>
                            <h1 className="mt-2 font-display text-3xl text-foreground">Your auction activity</h1>
                            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                                Review your bids, check whether you won or lost, and revisit auctions you participated in.
                            </p>
                        </div>
                        <Link
                            href={auctionHouse().url}
                            className="inline-flex items-center gap-2 border border-border bg-card px-5 py-3 text-[11px] tracking-[0.2em] text-foreground/75 uppercase transition-colors hover:border-gold/30 hover:text-gold"
                        >
                            <Gavel className="h-4 w-4" />
                            Back to Auction House
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Auctions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {auctions.data.length > 0 ? auctions.data.map((auction) => (
                                <Link
                                    key={auction.id}
                                    href={showMyAuction({ auction }).url}
                                    className="grid gap-4 border border-border p-4 transition-colors hover:border-gold/30 md:grid-cols-[minmax(0,1fr)_auto]"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <p className="text-[10px] tracking-[0.2em] text-gold uppercase">{auction.lot_number}</p>
                                            <span className={`rounded-full border px-2 py-1 text-[10px] tracking-[0.16em] uppercase ${outcomeClasses(auction)}`}>
                                                {outcomeLabel(auction)}
                                            </span>
                                        </div>
                                        <h2 className="mt-2 font-display text-2xl text-foreground">{auction.title}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {auction.inventory_snapshot?.brand_name ?? 'Auction'} · {auction.user_bid_count ?? 0} bids placed by you
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-5 text-sm text-foreground/75">
                                            <div>
                                                <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Your highest bid</p>
                                                <p className="mt-1 font-medium">{auction.user_max_bid_amount ? formatCurrency(auction.user_max_bid_amount) : '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Current / final</p>
                                                <p className="mt-1 font-medium">
                                                    {formatCurrency(auction.hammer_price ?? auction.current_bid_amount ?? auction.starting_price)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-center">
                                        <div className="text-right">
                                            <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Status</p>
                                            <p className="mt-1 text-sm text-foreground/75">{auction.status}</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 text-sm text-gold">
                                            <Gavel className="h-4 w-4" />
                                            View auction
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <p className="text-sm text-muted-foreground">You have not participated in any auctions yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

MyAuctionBids.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
