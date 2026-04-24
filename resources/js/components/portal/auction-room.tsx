import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Clock3, Gavel, MessageSquareText, Radio, ScrollText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/currency';
import { auctionHouse } from '@/routes/portal';
import { store as storeAuctionBid } from '@/routes/portal/auctions/bids';
import { show as showAuction } from '@/routes/portal/auctions';
import { auctions as profileAuctions } from '@/routes/portal/profile';
import type { Auction, Auth } from '@/types';

type Props = {
    auctions: Auction[];
    selectedAuction: Auction | null;
    mode?: string;
    useAuctionShowLinks?: boolean;
};

type RoomTab = 'history' | 'chat' | 'details';
type AuctionStageView = 'live' | 'scheduled';

function formatCountdown(auction: Auction, now: number | null): string {
    if (auction.status === 'closed' || auction.status === 'cancelled') {
        return '00:00:00';
    }

    if (now === null) {
        return '--:--:--';
    }

    const difference = new Date(auction.ends_at).getTime() - now;

    if (difference <= 0) {
        return '00:00:00';
    }

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':');
}

function bidSuggestions(auction: Auction): string[] {
    const minimumAllowedBid = Number(auction.minimum_allowed_bid);
    const increment = Number(auction.minimum_increment);

    return [
        minimumAllowedBid,
        minimumAllowedBid + increment,
        minimumAllowedBid + increment * 2,
        minimumAllowedBid + increment * 4,
    ].map((value) => value.toFixed(2));
}

function formatPlacedAt(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function statusBadgeClasses(status: Auction['status']): string {
    if (status === 'live') {
        return 'border-red-500/40 bg-red-500/12 text-red-300';
    }

    if (status === 'scheduled') {
        return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
    }

    if (status === 'closed') {
        return 'border-white/10 bg-white/5 text-foreground/70';
    }

    if (status === 'cancelled') {
        return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300';
    }

    return 'border-gold/30 bg-gold/10 text-gold';
}

function statusLabel(status: Auction['status']): string {
    return status.replaceAll('_', ' ');
}

function participationMessage(auction: Auction): { title: string; body: string; tone: string } | null {
    if (!auction.user_has_bid || !auction.participation_result) {
        return null;
    }

    if (auction.participation_result === 'won') {
        return {
            title: 'You won this auction',
            body: `Congratulations. Your winning bid is ${formatCurrency(auction.hammer_price ?? auction.current_bid_amount ?? auction.starting_price)}.`,
            tone: 'border-green-500/30 bg-green-500/10 text-green-100',
        };
    }

    if (auction.participation_result === 'lost') {
        return {
            title: 'Auction closed without your winning bid',
            body: 'This auction has ended and another bidder placed the highest valid bid.',
            tone: 'border-white/10 bg-white/5 text-foreground/80',
        };
    }

    if (auction.participation_result === 'reserve_not_met') {
        return {
            title: 'Reserve not met',
            body: 'This auction closed without meeting the reserve, so no winner was assigned.',
            tone: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
        };
    }

    return null;
}

export default function AuctionRoom({ auctions, selectedAuction, mode = 'auction', useAuctionShowLinks = false }: Props) {
    const [activeTab, setActiveTab] = useState<RoomTab>('history');
    const [now, setNow] = useState<number | null>(null);
    const [auctionStageView, setAuctionStageView] = useState<AuctionStageView>('live');
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAuthenticated = Boolean(auth?.user);
    const suggestions = useMemo(() => (selectedAuction ? bidSuggestions(selectedAuction) : []), [selectedAuction]);
    const liveAuctions = useMemo(() => auctions.filter((auction) => auction.status === 'live'), [auctions]);
    const scheduledAuctions = useMemo(() => auctions.filter((auction) => auction.status === 'scheduled'), [auctions]);
    const visibleAuctions = auctionStageView === 'scheduled' ? scheduledAuctions : liveAuctions;
    const displayedAuction = useMemo(() => {
        if (useAuctionShowLinks) {
            return selectedAuction;
        }

        if (auctionStageView === 'scheduled' && selectedAuction?.status === 'scheduled') {
            return selectedAuction;
        }

        if (auctionStageView === 'live' && selectedAuction?.status === 'live') {
            return selectedAuction;
        }

        return visibleAuctions[0] ?? selectedAuction ?? null;
    }, [auctionStageView, selectedAuction, useAuctionShowLinks, visibleAuctions]);
    const resultMessage = displayedAuction ? participationMessage(displayedAuction) : null;
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: selectedAuction ? selectedAuction.minimum_allowed_bid.toString() : '',
    });

    useEffect(() => {
        setNow(Date.now());

        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        setActiveTab('history');
        reset('amount');

        if (displayedAuction) {
            setData('amount', displayedAuction.minimum_allowed_bid.toString());
        }
    }, [displayedAuction, reset, setData]);

    useEffect(() => {
        if (useAuctionShowLinks || selectedAuction === null) {
            return;
        }

        if (selectedAuction.status === 'scheduled') {
            setAuctionStageView('scheduled');

            return;
        }

        setAuctionStageView('live');
    }, [selectedAuction, useAuctionShowLinks]);

    function buildAuctionHref(auction: Auction): string {
        if (useAuctionShowLinks) {
            return showAuction({ auction }).url;
        }

        return auctionHouse({
            query: {
                auction: auction.slug,
                view: 'auction',
            },
        }).url;
    }

    function placeBid(): void {
        if (!displayedAuction) {
            return;
        }

        post(storeAuctionBid({ auction: displayedAuction }).url, {
            preserveScroll: true,
        });
    }

    const isNegotiationView = mode === 'negotiation';

    return (
        <div className="py-8">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="mb-6 flex flex-wrap gap-3 border-b border-border/60 pb-5">
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={auctionHouse({ query: { view: 'auction', auction: displayedAuction?.slug } }).url}
                            className={`inline-flex items-center gap-2 border px-5 py-3 text-[11px] tracking-[0.24em] uppercase transition-colors ${
                                !isNegotiationView
                                    ? 'border-gold bg-gold text-black'
                                    : 'border-border bg-card text-foreground/70 hover:border-gold/40 hover:text-gold'
                            }`}
                        >
                            <Gavel className="h-4 w-4" />
                            Live Auction
                        </Link>
                        <Link
                            href={auctionHouse({ query: { view: 'negotiation' } }).url}
                            className={`inline-flex items-center gap-2 border px-5 py-3 text-[11px] tracking-[0.24em] uppercase transition-colors ${
                                isNegotiationView
                                    ? 'border-gold bg-gold text-black'
                                    : 'border-border bg-card text-foreground/70 hover:border-gold/40 hover:text-gold'
                            }`}
                        >
                            <MessageSquareText className="h-4 w-4" />
                            Live Negotiation
                        </Link>
                    </div>
                    {isAuthenticated && (
                        <Button asChild variant="outline" className="ml-auto rounded-none border-border bg-transparent px-5 tracking-[0.18em] uppercase">
                            <Link href={profileAuctions().url}>My Auctions</Link>
                        </Button>
                    )}
                </div>

                {isNegotiationView ? (
                    <div className="border border-border bg-card/70 px-6 py-12 text-center">
                        <p className="mb-2 text-[10px] tracking-[0.25em] text-gold uppercase">Coming next</p>
                        <h1 className="font-display text-3xl text-foreground">Live Negotiation</h1>
                        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
                            This space keeps the previous mock route available, but the live negotiation experience will be implemented in a later phase.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                        <aside className="border border-border bg-card/70">
                            <div className="border-b border-border px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] tracking-[0.22em] text-gold uppercase">
                                            {auctionStageView === 'scheduled' ? 'Upcoming auctions' : 'Active lots'}
                                        </p>
                                        <h2 className="mt-1 text-sm text-foreground/80">
                                            {auctionStageView === 'scheduled' ? `${scheduledAuctions.length} scheduled auctions` : `${liveAuctions.length} live auctions`}
                                        </h2>
                                    </div>
                                    {scheduledAuctions.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setAuctionStageView((current) => (current === 'live' ? 'scheduled' : 'live'))}
                                            className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] text-gold uppercase transition-colors hover:text-gold/80"
                                        >
                                            {auctionStageView === 'scheduled' ? (
                                                <>
                                                    <ArrowLeft className="h-3.5 w-3.5" />
                                                    <span>Live auctions</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Upcoming auctions</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
                                {visibleAuctions.length > 0 ? (
                                    visibleAuctions.map((auction) => {
                                        const isActive = displayedAuction?.id === auction.id;

                                        return (
                                            <button
                                                key={auction.id}
                                                type="button"
                                                onClick={() => router.visit(buildAuctionHref(auction), { preserveScroll: true })}
                                                className={`grid w-full grid-cols-[72px_minmax(0,1fr)] gap-4 border-b border-border/70 px-4 py-4 text-left transition-colors ${
                                                    isActive ? 'bg-gold/10' : 'hover:bg-white/3'
                                                }`}
                                            >
                                                <div className="aspect-square overflow-hidden bg-secondary">
                                                    {auction.inventory_snapshot?.image_url ? (
                                                        <img
                                                            src={auction.inventory_snapshot.image_url}
                                                            alt={auction.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No image</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-[10px] tracking-[0.18em] text-gold uppercase">{auction.lot_number}</p>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {auctionStageView === 'scheduled' ? formatPlacedAt(auction.starts_at) : formatCountdown(auction, now)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] tracking-[0.18em] text-foreground/55 uppercase">
                                                        {auction.inventory_snapshot?.brand_name ?? 'Auction'}
                                                    </p>
                                                    <h3 className="truncate font-display text-lg text-foreground">{auction.title}</h3>
                                                    <p className="mt-2 text-sm font-medium text-gold">{formatCurrency(auction.current_bid_amount ?? auction.starting_price)}</p>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="px-4 py-8 text-sm text-muted-foreground">
                                        {auctionStageView === 'scheduled'
                                            ? 'No scheduled auctions available right now.'
                                            : 'No live auctions available right now.'}
                                    </div>
                                )}
                            </div>
                        </aside>

                        <section className="border border-border bg-card/70">
                            {displayedAuction ? (
                                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                                    <div className="border-b border-border px-5 py-5 xl:col-span-2">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <p className="text-[10px] tracking-[0.22em] text-gold uppercase">{displayedAuction.lot_number}</p>
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] tracking-[0.18em] uppercase ${statusBadgeClasses(displayedAuction.status)}`}>
                                                        {displayedAuction.status === 'live' && <Radio className="h-3 w-3" />}
                                                        {statusLabel(displayedAuction.status)}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-[11px] tracking-[0.2em] text-foreground/55 uppercase">
                                                    {displayedAuction.inventory_snapshot?.brand_name ?? 'Auction'}
                                                </p>
                                                <h1 className="mt-1 font-display text-3xl text-foreground xl:text-4xl">{displayedAuction.title}</h1>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] tracking-[0.22em] text-foreground/45 uppercase">Time remaining</p>
                                                <p className="mt-2 font-display text-3xl text-foreground">{formatCountdown(displayedAuction, now)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5 px-5 pb-5">
                                        {resultMessage && (
                                            <div className={`border px-4 py-3 ${resultMessage.tone}`}>
                                                <p className="text-[10px] tracking-[0.2em] uppercase">Participation result</p>
                                                <h2 className="mt-2 font-display text-2xl">{resultMessage.title}</h2>
                                                <p className="mt-2 text-sm opacity-90">{resultMessage.body}</p>
                                            </div>
                                        )}

                                        <div className="aspect-[4/3] overflow-hidden bg-secondary/80">
                                            {displayedAuction.inventory_snapshot?.image_url ? (
                                                <img
                                                    src={displayedAuction.inventory_snapshot.image_url}
                                                    alt={displayedAuction.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image available</div>
                                            )}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-[10px] tracking-[0.22em] text-foreground/45 uppercase">Current bid</p>
                                                <p className="mt-2 font-display text-4xl text-gold">
                                                    {formatCurrency(displayedAuction.current_bid_amount ?? displayedAuction.starting_price)}
                                                </p>
                                            </div>
                                            <div className="text-right md:text-left">
                                                <p className="text-[10px] tracking-[0.22em] text-foreground/45 uppercase">Estimate / reserve</p>
                                                <p className="mt-2 text-sm text-foreground/75">
                                                    {displayedAuction.reserve_price
                                                        ? formatCurrency(displayedAuction.reserve_price)
                                                        : formatCurrency(displayedAuction.starting_price)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/60 uppercase tracking-[0.18em]">
                                            <div className="inline-flex items-center gap-2">
                                                <Clock3 className="h-4 w-4 text-gold" />
                                                {displayedAuction.bids_count ?? 0} bids
                                            </div>
                                            <div className="inline-flex items-center gap-2">
                                                <Gavel className="h-4 w-4 text-gold" />
                                                Min bid {formatCurrency(String(displayedAuction.minimum_allowed_bid))}
                                            </div>
                                        </div>

                                        {displayedAuction.status === 'live' ? (
                                            <div className="border border-border bg-black/15 p-4">
                                                {isAuthenticated ? (
                                                    <>
                                                        <p className="text-[10px] tracking-[0.22em] text-foreground/45 uppercase">Place bid</p>
                                                        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                                                            <Input
                                                                value={data.amount}
                                                                onChange={(event) => setData('amount', event.target.value)}
                                                                className="h-12 border-border bg-background/40 text-base"
                                                            />
                                                            <Button
                                                                className="h-12 rounded-none bg-gold text-black hover:bg-gold/90"
                                                                disabled={processing}
                                                                onClick={placeBid}
                                                            >
                                                                {processing ? 'Placing...' : 'Place bid'}
                                                            </Button>
                                                        </div>
                                                        <InputError message={errors.amount} />
                                                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                            {suggestions.map((amount) => (
                                                                <Button
                                                                    key={amount}
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="rounded-none border-border bg-transparent text-foreground/75 hover:bg-gold/10 hover:text-gold"
                                                                    onClick={() => setData('amount', amount)}
                                                                >
                                                                    {formatCurrency(amount)}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-muted-foreground">
                                                            Sign in with a verified account to participate in this auction.
                                                        </p>
                                                        <Button asChild className="rounded-none bg-gold text-black hover:bg-gold/90">
                                                            <Link href="/login">Sign in to bid</Link>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="border border-border bg-black/15 p-4 text-sm text-muted-foreground">
                                                {displayedAuction.status === 'closed'
                                                    ? `This auction is closed. Final result: ${displayedAuction.closure_result ?? 'completed'}.`
                                                    : 'This auction is not accepting bids at the moment.'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-border xl:border-t-0 xl:border-l">
                                        <div className="grid grid-cols-3 border-b border-border">
                                            {[
                                                { key: 'history', label: 'Bid History', icon: Gavel },
                                                { key: 'chat', label: 'Live Chat', icon: MessageSquareText },
                                                { key: 'details', label: 'Details', icon: ScrollText },
                                            ].map(({ key, label, icon: Icon }) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setActiveTab(key as RoomTab)}
                                                    className={`inline-flex items-center justify-center gap-2 px-3 py-4 text-[10px] tracking-[0.18em] uppercase transition-colors ${
                                                        activeTab === key
                                                            ? 'border-b border-gold text-gold'
                                                            : 'text-foreground/45 hover:text-foreground/75'
                                                    }`}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span className="hidden sm:inline">{label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="min-h-[520px] px-5 py-4">
                                            {activeTab === 'history' && (
                                                <div className="space-y-3">
                                                    {displayedAuction.bids && displayedAuction.bids.length > 0 ? (
                                                        displayedAuction.bids.map((bid) => (
                                                            <div key={bid.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/60 py-3 last:border-0">
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-foreground">
                                                                        {bid.user?.name ?? `Bidder #${bid.user_id}`}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-muted-foreground">{formatPlacedAt(bid.placed_at)}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-medium text-gold">{formatCurrency(bid.amount)}</p>
                                                                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-foreground/45">
                                                                        {bid.is_winning ? 'Winning' : 'Recorded'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No bids have been recorded yet.</p>
                                                    )}
                                                </div>
                                            )}

                                            {activeTab === 'chat' && (
                                                <div className="flex h-full min-h-[420px] items-center justify-center text-center">
                                                    <div>
                                                        <p className="text-[10px] tracking-[0.22em] text-gold uppercase">Upcoming</p>
                                                        <h2 className="mt-2 font-display text-2xl text-foreground">Live Chat</h2>
                                                        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                                                            Live chat will be added in a future iteration of the auctions module.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'details' && (
                                                <div className="flex h-full min-h-[420px] items-center justify-center text-center">
                                                    <div>
                                                        <p className="text-[10px] tracking-[0.22em] text-gold uppercase">Upcoming</p>
                                                        <h2 className="mt-2 font-display text-2xl text-foreground">Details</h2>
                                                        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                                                            Extended lot details will be added here in a future iteration.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-h-[540px] items-center justify-center px-6 text-center">
                                    <div>
                                        <p className="text-[10px] tracking-[0.22em] text-gold uppercase">Auction House</p>
                                        <h1 className="mt-2 font-display text-3xl text-foreground">No auctions available</h1>
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            There are no visible auctions to display right now.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
