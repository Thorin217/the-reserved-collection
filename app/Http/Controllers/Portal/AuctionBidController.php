<?php

namespace App\Http\Controllers\Portal;

use App\Actions\Auctions\RegisterAuctionBid;
use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\StoreAuctionBidRequest;
use App\Models\Auction;
use Illuminate\Http\RedirectResponse;

class AuctionBidController extends Controller
{
    public function store(StoreAuctionBidRequest $request, Auction $auction, RegisterAuctionBid $registerAuctionBid): RedirectResponse
    {
        $registerAuctionBid->handle(
            $auction,
            $request->user(),
            (float) $request->validated('amount'),
        );

        return back()->with('success', 'Bid placed successfully.');
    }
}
