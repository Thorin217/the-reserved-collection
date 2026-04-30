<?php

namespace App\Http\Controllers\Portal;

use App\Enums\AuctionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuctionResource;
use App\Http\Resources\ProductNegotiationResource;
use App\Models\Auction;
use App\Models\ProductNegotiation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuctionController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()?->id;

        $auctions = $this->visibleAuctionsQuery($userId)
            ->visible()
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByRaw("case when status = 'live' then 0 when status = 'scheduled' then 1 else 2 end")
            ->orderBy('ends_at')
            ->get();

        $selectedAuctionSlug = $request->string('auction')->toString();

        /** @var Auction|null $selectedAuctionSummary */
        $selectedAuctionSummary = $selectedAuctionSlug !== ''
            ? $auctions->firstWhere('slug', $selectedAuctionSlug)
            : $auctions->first();

        $selectedAuction = $selectedAuctionSummary
            ? $this->visibleAuctionsQuery($userId)
                ->visible()
                ->with([
                    'items.product.brand',
                    'items.product.category',
                    'items.productVariant',
                    'items.productSerial',
                    'winner',
                    'currentBidUser',
                    'bids' => fn ($query) => $query->with('user')->latest('placed_at')->limit(25),
                ])
                ->find($selectedAuctionSummary->id)
            : null;

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
            'auctions' => AuctionResource::collection($auctions),
            'selected_auction' => $selectedAuction ? AuctionResource::make($selectedAuction) : null,
            'filters' => $request->only(['status', 'auction', 'view', 'negotiation']),
            'negotiations' => $negotiations,
            'selected_negotiation' => $selectedNegotiation,
        ]);
    }

    public function show(Auction $auction): Response
    {
        abort_unless(! in_array($auction->status, [AuctionStatus::Draft, AuctionStatus::Cancelled], true), 404);

        $userId = request()->user()?->id;

        $auctions = $this->visibleAuctionsQuery($userId)
            ->visible()
            ->orderByRaw("case when status = 'live' then 0 when status = 'scheduled' then 1 else 2 end")
            ->orderBy('ends_at')
            ->get();

        $auction = $this->visibleAuctionsQuery($userId)
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

        return Inertia::render('portal/auctions/show', [
            'auctions' => AuctionResource::collection($auctions),
            'auction' => AuctionResource::make($auction),
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
        return Auction::query()
            ->withCount('bids')
            ->with('items')
            ->when($userId !== null, function ($query) use ($userId): void {
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
            });
    }
}
