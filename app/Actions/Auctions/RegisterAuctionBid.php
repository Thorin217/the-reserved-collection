<?php

namespace App\Actions\Auctions;

use App\Models\Auction;
use App\Models\AuctionBid;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RegisterAuctionBid
{
    public function handle(Auction $auction, User $user, float $amount): AuctionBid
    {
        if ($user->hasRole('admin')) {
            throw ValidationException::withMessages([
                'amount' => 'Admin users can not place auction bids.',
            ]);
        }

        return DB::transaction(function () use ($auction, $user, $amount): AuctionBid {
            /** @var Auction $lockedAuction */
            $lockedAuction = Auction::query()
                ->lockForUpdate()
                ->findOrFail($auction->id);

            if (! $lockedAuction->canAcceptBids()) {
                throw ValidationException::withMessages([
                    'amount' => 'This auction is no longer accepting bids.',
                ]);
            }

            if ($amount < $lockedAuction->minimumAllowedBid()) {
                throw ValidationException::withMessages([
                    'amount' => 'Your bid must meet the minimum allowed amount.',
                ]);
            }

            if ($lockedAuction->current_bid_user_id === $user->id) {
                throw ValidationException::withMessages([
                    'amount' => 'You already hold the highest bid for this auction.',
                ]);
            }

            $latestUserBid = $lockedAuction->bids()
                ->where('user_id', $user->id)
                ->latest('placed_at')
                ->first();

            if ($latestUserBid !== null && $latestUserBid->placed_at !== null && $latestUserBid->placed_at->diffInSeconds(now()) < 4) {
                throw ValidationException::withMessages([
                    'amount' => 'Please wait at least 4 seconds before placing another bid.',
                ]);
            }

            $bid = $lockedAuction->bids()->create([
                'user_id' => $user->id,
                'amount' => $amount,
                'placed_at' => now(),
                'is_winning' => false,
            ]);

            $lockedAuction->update([
                'current_bid_amount' => $amount,
                'current_bid_user_id' => $user->id,
            ]);

            return $bid->fresh(['user', 'auction']);
        });
    }
}
