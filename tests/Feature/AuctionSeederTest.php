<?php

use App\Enums\AuctionStatus;
use App\Models\Auction;
use Database\Seeders\AuctionSeeder;
use Database\Seeders\PhaseOneInventorySeeder;
use Database\Seeders\PortalSeeder;

it('seeds four live auctions and two scheduled auctions without duplication', function () {
    $this->seed([
        PhaseOneInventorySeeder::class,
        PortalSeeder::class,
        AuctionSeeder::class,
        AuctionSeeder::class,
    ]);

    expect(Auction::query()->count())->toBe(6)
        ->and(Auction::query()->where('status', AuctionStatus::Live)->count())->toBe(4)
        ->and(Auction::query()->where('status', AuctionStatus::Scheduled)->count())->toBe(2)
        ->and(Auction::query()->where('status', AuctionStatus::Live)->whereNotNull('current_bid_amount')->count())->toBe(4)
        ->and(Auction::query()->where('status', AuctionStatus::Scheduled)->whereNull('current_bid_amount')->count())->toBe(2)
        ->and(Auction::query()->where('status', AuctionStatus::Live)->has('bids')->count())->toBe(4)
        ->and(
            Auction::query()
                ->where('status', AuctionStatus::Live)
                ->with('bids')
                ->get()
                ->every(fn (Auction $auction) => $auction->bids->where('is_winning', true)->count() === 1)
        )->toBeTrue()
        ->and(
            Auction::query()
                ->where('status', AuctionStatus::Live)
                ->get()
                ->every(fn (Auction $auction) => $auction->starts_at?->isPast() && $auction->ends_at?->isFuture())
        )->toBeTrue()
        ->and(
            Auction::query()
                ->where('status', AuctionStatus::Scheduled)
                ->get()
                ->every(fn (Auction $auction) => $auction->starts_at?->isFuture() && $auction->ends_at?->gt($auction->starts_at))
        )->toBeTrue();
});
