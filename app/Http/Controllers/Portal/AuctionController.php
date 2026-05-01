<?php

namespace App\Http\Controllers\Portal;

use App\Enums\AuctionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuctionEventResource;
use App\Http\Resources\AuctionResource;
use App\Http\Resources\ProductNegotiationResource;
use App\Models\Auction;
use App\Models\AuctionEvent;
use App\Models\ProductNegotiation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuctionController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()?->id;

        $events = $this->visibleEventsQuery($userId)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByRaw("case when status = 'live' then 0 when status = 'scheduled' then 1 else 2 end")
            ->orderBy('ends_at')
            ->get();

        $selectedEventSlug = $request->string('event')->toString();
        $selectedAuctionSlug = $request->string('auction')->toString();

        /** @var AuctionEvent|null $selectedEvent */
        $selectedEvent = $selectedEventSlug !== ''
            ? $events->firstWhere('slug', $selectedEventSlug)
            : null;

        if ($selectedEvent === null && $selectedAuctionSlug !== '') {
            $selectedEvent = $events->first(
                fn (AuctionEvent $event) => $event->auctions->contains('slug', $selectedAuctionSlug),
            );
        }

        $selectedEvent ??= $events->first();

        $isNegotiationView = $request->input('view') === 'negotiation' && $request->user();

        $negotiations = $isNegotiationView
            ? ProductNegotiationResource::collection(
                ProductNegotiation::query()
                    ->where('user_id', $request->user()->id)
                    ->with('product.brand')
                    ->withCount('messages')
                    ->latest()
                    ->get()
            )
            : null;

        $selectedNegotiationId = $request->integer('negotiation');
        $selectedNegotiation = $isNegotiationView && $selectedNegotiationId > 0
            ? ProductNegotiationResource::make(
                ProductNegotiation::query()
                    ->where('user_id', $request->user()->id)
                    ->with(['product.brand', 'messages.user'])
                    ->findOrFail($selectedNegotiationId)
            )
            : null;

        return Inertia::render('portal/auction-house', [
            'events' => AuctionEventResource::collection($events),
            'selected_event' => $selectedEvent ? AuctionEventResource::make($selectedEvent) : null,
            'selected_auction_slug' => $selectedAuctionSlug !== '' ? $selectedAuctionSlug : null,
            'filters' => $request->only(['status', 'auction', 'view', 'negotiation']),
            'negotiations' => $negotiations,
            'selected_negotiation' => $selectedNegotiation,
        ]);
    }

    public function show(Auction $auction): Response
    {
        abort_unless(! in_array($auction->status, [AuctionStatus::Draft, AuctionStatus::Cancelled], true), 404);

        $userId = request()->user()?->id;

        $events = $this->visibleEventsQuery($userId)
            ->orderByRaw("case when status = 'live' then 0 when status = 'scheduled' then 1 else 2 end")
            ->orderBy('ends_at')
            ->get();

        $selectedEvent = $events->firstWhere('id', $auction->auction_event_id);

        if ($selectedEvent === null) {
            $selectedEvent = $this->visibleEventsQuery($userId)
                ->whereKey($auction->auction_event_id)
                ->firstOrFail();
        }

        return Inertia::render('portal/auctions/show', [
            'events' => AuctionEventResource::collection($events),
            'selected_event' => AuctionEventResource::make($selectedEvent),
            'selected_auction_slug' => $auction->slug,
        ]);
    }

    public function showEvent(Request $request, AuctionEvent $auctionEvent): Response
    {
        abort_unless(! in_array($auctionEvent->status, [AuctionStatus::Draft, AuctionStatus::Cancelled], true), 404);

        $userId = $request->user()?->id;

        $events = $this->visibleEventsQuery($userId)
            ->orderByRaw("case when status = 'live' then 0 when status = 'scheduled' then 1 else 2 end")
            ->orderBy('ends_at')
            ->get();

        $selectedEvent = $events->firstWhere('id', $auctionEvent->id);

        if ($selectedEvent === null) {
            $selectedEvent = $this->visibleEventsQuery($userId)
                ->whereKey($auctionEvent->id)
                ->firstOrFail();
        }

        $selectedAuctionSlug = $request->string('auction')->toString();

        if (
            $selectedAuctionSlug !== ''
            && ! collect($selectedEvent->auctions)->contains('slug', $selectedAuctionSlug)
        ) {
            abort(404);
        }

        return Inertia::render('portal/auction-events/show', [
            'events' => AuctionEventResource::collection($events),
            'selected_event' => AuctionEventResource::make($selectedEvent),
            'selected_auction_slug' => $selectedAuctionSlug !== '' ? $selectedAuctionSlug : null,
        ]);
    }

    public function participations(Request $request): Response
    {
        $userId = $request->user()->id;

        $auctions = Auction::query()
            ->withCount('bids')
            ->withCount([
                'bids as user_bid_count' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->withExists([
                'bids as user_has_bid' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->withMax([
                'bids as user_max_bid_amount' => fn ($query) => $query->where('user_id', $userId),
            ], 'amount')
            ->whereHas('bids', fn ($query) => $query->where('user_id', $userId))
            ->with(['winner', 'items'])
            ->latest('starts_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('portal/auctions/my-bids', [
            'auctions' => AuctionResource::collection($auctions),
        ]);
    }

    public function participationShow(Request $request, Auction $auction): Response
    {
        $userId = $request->user()->id;

        abort_unless(
            Auction::query()
                ->whereKey($auction->id)
                ->whereHas('bids', fn ($query) => $query->where('user_id', $userId))
                ->exists(),
            404,
        );

        $auction = Auction::query()
            ->withCount('bids')
            ->withCount([
                'bids as user_bid_count' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->withExists([
                'bids as user_has_bid' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->withMax([
                'bids as user_max_bid_amount' => fn ($query) => $query->where('user_id', $userId),
            ], 'amount')
            ->with([
                'items.product.brand',
                'items.product.category',
                'items.productVariant',
                'items.productSerial',
                'winner',
                'currentBidUser',
                'bids' => fn ($query) => $query->with('user')->latest('placed_at')->limit(25),
            ])
            ->findOrFail($auction->id);

        return Inertia::render('portal/auctions/my-bid-show', [
            'auction' => AuctionResource::make($auction),
        ]);
    }

    private function visibleAuctionsQuery(?int $userId): Builder
    {
        return $this->applyVisibleAuctionLoads(Auction::query(), $userId);
    }

    private function visibleEventsQuery(?int $userId): Builder
    {
        return AuctionEvent::query()
            ->whereHas('auctions', fn (Builder $query) => $query->visible())
            ->with([
                'auctions' => fn ($query) => $this
                    ->applyVisibleAuctionLoads($query, $userId, withBidHistory: true)
                    ->visible()
                    ->orderBy('sequence'),
            ])
            ->withCount([
                'auctions' => fn ($query) => $query->visible(),
            ]);
    }

    private function applyVisibleAuctionLoads(
        Builder|Relation $query,
        ?int $userId,
        bool $withBidHistory = false,
    ): Builder|Relation {
        $query
            ->withCount('bids')
            ->with([
                'items.product.brand',
                'items.product.category',
                'items.productVariant',
                'items.productSerial',
                'winner',
                'currentBidUser',
            ]);

        if ($withBidHistory) {
            $query->with([
                'bids' => fn ($bidQuery) => $bidQuery->with('user')->latest('placed_at')->limit(25),
            ]);
        }

        if ($userId !== null) {
            $query
                ->withCount([
                    'bids as user_bid_count' => fn ($bidQuery) => $bidQuery->where('user_id', $userId),
                ])
                ->withExists([
                    'bids as user_has_bid' => fn ($bidQuery) => $bidQuery->where('user_id', $userId),
                ])
                ->withMax([
                    'bids as user_max_bid_amount' => fn ($bidQuery) => $bidQuery->where('user_id', $userId),
                ], 'amount');
        }

        return $query;
    }
}
