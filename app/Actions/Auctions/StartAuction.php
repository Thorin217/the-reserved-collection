<?php

namespace App\Actions\Auctions;

use App\Enums\AuctionStatus;
use App\Models\Auction;

class StartAuction
{
    public function handle(Auction $auction): void
    {
        if ($auction->status !== AuctionStatus::Scheduled) {
            return;
        }

        if ($auction->starts_at === null || $auction->starts_at->isFuture()) {
            return;
        }

        $auction->update([
            'status' => AuctionStatus::Live,
        ]);
    }
}
