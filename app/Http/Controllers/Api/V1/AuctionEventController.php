<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auctions\CreateAuctionEvent;
use App\Actions\Auctions\UpdateAuctionEvent;
use App\Enums\AuctionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreAuctionEventApiRequest;
use App\Http\Resources\AuctionEventResource;
use App\Models\AuctionEvent;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuctionEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'in:draft,scheduled,live,closed,cancelled'],
            'format' => ['nullable', 'in:lot,grouped_items'],
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) $request->integer('per_page', 15);

        $events = AuctionEvent::query()
            ->with(['creator'])
            ->withCount('auctions')
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')))
            ->when($request->filled('format'), fn (Builder $query) => $query->where('format', $request->string('format')))
            ->when($request->filled('search'), function (Builder $query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function (Builder $inner) use ($search): void {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(
            'Auction events retrieved successfully.',
            AuctionEventResource::collection($events)->response()->getData(true)
        );
    }

    public function show(Request $request, AuctionEvent $auctionEvent): JsonResponse
    {
        $validated = $request->validate([
            'include' => ['nullable', 'string'],
        ]);

        $includes = $this->parseIncludes($validated['include'] ?? null);

        $relations = ['creator'];

        if (in_array('auctions', $includes, true)) {
            $relations['auctions'] = fn ($query) => $query
                ->with(['creator', 'winner', 'items.product.brand', 'items.productVariant', 'items.productSerial'])
                ->withCount('bids')
                ->orderBy('sequence');
        }

        $auctionEvent->load($relations)->loadCount('auctions');

        return ApiResponse::success(
            'Auction event retrieved successfully.',
            AuctionEventResource::make($auctionEvent)->resolve()
        );
    }

    public function store(StoreAuctionEventApiRequest $request, CreateAuctionEvent $createAuctionEvent): JsonResponse
    {
        $event = $createAuctionEvent->handle($request->validated(), $request->user());

        $event->load(['creator', 'auctions'])->loadCount('auctions');

        return ApiResponse::success(
            'Auction event created successfully.',
            AuctionEventResource::make($event)->resolve(),
            201
        );
    }

    public function update(StoreAuctionEventApiRequest $request, AuctionEvent $auctionEvent, UpdateAuctionEvent $updateAuctionEvent): JsonResponse
    {
        if ($auctionEvent->auctions()->where('status', '!=', AuctionStatus::Draft->value)->exists()) {
            return ApiResponse::error('Only draft auction events can be updated.', null, 422);
        }

        $updateAuctionEvent->handle($auctionEvent, $request->validated());

        $auctionEvent->load(['creator', 'auctions'])->loadCount('auctions');

        return ApiResponse::success(
            'Auction event updated successfully.',
            AuctionEventResource::make($auctionEvent)->resolve()
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
            ->filter(fn (string $value): bool => in_array($value, ['auctions'], true))
            ->unique()
            ->values()
            ->all();
    }
}
