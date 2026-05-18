<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auctions\CloseAuction;
use App\Actions\Auctions\CreateAuction;
use App\Actions\Auctions\SyncAuctionEventStatus;
use App\Actions\Auctions\UpdateAuction;
use App\Enums\AuctionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreAuctionApiRequest;
use App\Http\Resources\AuctionResource;
use App\Models\Auction;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuctionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'in:draft,scheduled,live,closed,cancelled'],
            'closure_result' => ['nullable', 'in:sold,unsold,reserve_not_met'],
            'inventory_source_type' => ['nullable', 'in:serial,variant,mixed'],
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) $request->integer('per_page', 15);

        $auctions = Auction::query()
            ->with(['creator', 'winner', 'event'])
            ->withCount('bids')
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')))
            ->when($request->filled('closure_result'), fn (Builder $query) => $query->where('closure_result', $request->string('closure_result')))
            ->when($request->filled('inventory_source_type'), fn (Builder $query) => $query->where('inventory_source_type', $request->string('inventory_source_type')))
            ->when($request->filled('search'), function (Builder $query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function (Builder $inner) use ($search): void {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('lot_number', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(
            'Auctions retrieved successfully.',
            AuctionResource::collection($auctions)->response()->getData(true)
        );
    }

    public function show(Request $request, Auction $auction): JsonResponse
    {
        $validated = $request->validate([
            'include' => ['nullable', 'string'],
        ]);

        $includes = $this->parseIncludes($validated['include'] ?? null);

        $relations = ['creator', 'winner', 'event', 'currentBidUser'];

        if (in_array('items', $includes, true)) {
            $relations['items'] = fn ($query) => $query->with(['product.brand', 'productVariant', 'productSerial']);
        }

        if (in_array('bids', $includes, true)) {
            $relations['bids'] = fn ($query) => $query->with('user')->latest('placed_at');
        }

        $auction->load($relations)->loadCount('bids');

        return ApiResponse::success(
            'Auction retrieved successfully.',
            AuctionResource::make($auction)->resolve()
        );
    }

    public function store(StoreAuctionApiRequest $request, CreateAuction $createAuction): JsonResponse
    {
        $auction = $createAuction->handle($request->validated(), $request->user());

        return ApiResponse::success(
            'Auction created successfully.',
            AuctionResource::make($auction)->resolve(),
            201
        );
    }

    public function update(StoreAuctionApiRequest $request, Auction $auction, UpdateAuction $updateAuction): JsonResponse
    {
        if ($auction->status !== AuctionStatus::Draft) {
            return ApiResponse::error('Only draft auctions can be updated.', null, 422);
        }

        $updated = $updateAuction->handle($auction, $request->validated());

        return ApiResponse::success(
            'Auction updated successfully.',
            AuctionResource::make($updated)->resolve()
        );
    }

    public function publish(Auction $auction, SyncAuctionEventStatus $syncAuctionEventStatus): JsonResponse
    {
        if ($auction->status !== AuctionStatus::Draft) {
            return ApiResponse::error('Only draft auctions can be published.', null, 422);
        }

        if ($auction->ends_at->isPast()) {
            return ApiResponse::error('Expired auctions can not be published.', null, 422);
        }

        $auction->update([
            'status' => now()->greaterThanOrEqualTo($auction->starts_at)
                ? AuctionStatus::Live
                : AuctionStatus::Scheduled,
        ]);

        if ($auction->event !== null) {
            $syncAuctionEventStatus->handle($auction->event);
        }

        $auction->load(['creator', 'winner', 'event', 'currentBidUser'])->loadCount('bids');

        return ApiResponse::success(
            'Auction published successfully.',
            AuctionResource::make($auction)->resolve()
        );
    }

    public function close(Request $request, Auction $auction, CloseAuction $closeAuction): JsonResponse
    {
        if (! in_array($auction->status, [AuctionStatus::Scheduled, AuctionStatus::Live], true)) {
            return ApiResponse::error('Only scheduled or live auctions can be closed.', null, 422);
        }

        $closed = $closeAuction->handle($auction, $request->user());

        return ApiResponse::success(
            'Auction closed successfully.',
            AuctionResource::make($closed)->resolve()
        );
    }

    public function cancel(Auction $auction, SyncAuctionEventStatus $syncAuctionEventStatus): JsonResponse
    {
        if (in_array($auction->status, [AuctionStatus::Closed, AuctionStatus::Cancelled], true)) {
            return ApiResponse::error('This auction can not be cancelled anymore.', null, 422);
        }

        $auction->update([
            'status' => AuctionStatus::Cancelled,
            'closed_at' => now(),
        ]);

        if ($auction->event !== null) {
            $syncAuctionEventStatus->handle($auction->event);
        }

        $auction->load(['creator', 'winner', 'event', 'currentBidUser'])->loadCount('bids');

        return ApiResponse::success(
            'Auction cancelled successfully.',
            AuctionResource::make($auction)->resolve()
        );
    }

    /**
     * @return array<int, string>
     */
    private function parseIncludes(?string $include): array
    {
        if ($include === null || trim($include) === '') {
            return [];
        }

        return collect(explode(',', $include))
            ->map(fn (string $value): string => trim($value))
            ->filter(fn (string $value): bool => in_array($value, ['items', 'bids'], true))
            ->unique()
            ->values()
            ->all();
    }
}
