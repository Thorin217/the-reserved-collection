<?php

namespace App\Actions\Auctions;

use App\Enums\AuctionClosureResult;
use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\AuctionBid;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CloseAuction
{
    public function handle(Auction $auction, ?User $closedBy = null): Auction
    {
        return DB::transaction(function () use ($auction, $closedBy): Auction {
            /** @var Auction $lockedAuction */
            $lockedAuction = Auction::query()
                ->with('bids')
                ->lockForUpdate()
                ->findOrFail($auction->id);

            if ($lockedAuction->status === AuctionStatus::Closed || $lockedAuction->status === AuctionStatus::Cancelled) {
                return $lockedAuction;
            }

            /** @var AuctionBid|null $highestBid */
            $highestBid = $lockedAuction->bids()
                ->orderByDesc('amount')
                ->orderBy('placed_at')
                ->orderBy('id')
                ->first();

            $result = AuctionClosureResult::Unsold;
            $winnerId = null;
            $winningBidId = null;
            $hammerPrice = null;

            $lockedAuction->bids()->update(['is_winning' => false]);

            if ($highestBid !== null) {
                $reservePrice = $lockedAuction->reserve_price !== null
                    ? (float) $lockedAuction->reserve_price
                    : null;

                if ($reservePrice !== null && (float) $highestBid->amount < $reservePrice) {
                    $result = AuctionClosureResult::ReserveNotMet;
                } else {
                    $result = AuctionClosureResult::Sold;
                    $winnerId = $highestBid->user_id;
                    $winningBidId = $highestBid->id;
                    $hammerPrice = $highestBid->amount;

                    $highestBid->update(['is_winning' => true]);
                }
            }

            $lockedAuction->update([
                'status' => AuctionStatus::Closed,
                'closure_result' => $result,
                'winner_user_id' => $winnerId,
                'winning_bid_id' => $winningBidId,
                'hammer_price' => $hammerPrice,
                'total_due' => $hammerPrice,
                'closed_at' => now(),
                'is_manually_closed' => $closedBy !== null,
                'closed_by' => $closedBy?->id,
            ]);

            return $lockedAuction->fresh([
                'winner',
                'winningBid',
                'currentBidUser',
                'items.product.brand',
                'items.product.category',
                'items.productVariant',
                'items.productSerial',
                'bids.user',
            ]);
        });
    }
}
