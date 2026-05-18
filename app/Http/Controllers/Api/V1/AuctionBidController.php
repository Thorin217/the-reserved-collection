<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auctions\RegisterAuctionBid;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBidRequest;
use App\Http\Resources\AuctionBidResource;
use App\Models\Auction;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuctionBidController extends Controller
{
    public function index(Request $request, Auction $auction): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 15);

        $bids = $auction->bids()
            ->with('user')
            ->latest('placed_at')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(
            'Auction bids retrieved successfully.',
            AuctionBidResource::collection($bids)->response()->getData(true)
        );
    }

    public function store(StoreBidRequest $request, Auction $auction, RegisterAuctionBid $registerBid): JsonResponse
    {
        $bid = $registerBid->handle($auction, $request->user(), (float) $request->validated('amount'));

        return ApiResponse::success(
            'Bid placed successfully.',
            AuctionBidResource::make($bid)->resolve(),
            201
        );
    }
}
