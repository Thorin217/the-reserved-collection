<?php

namespace App\Actions\Auctions;

use App\Enums\AuctionStatus;
use App\Models\AuctionEvent;

class SyncAuctionEventStatus
{
    public function handle(AuctionEvent $event): AuctionEvent
    {
        $event->loadMissing('auctions');

        $auctions = $event->auctions;

        if ($auctions->isEmpty()) {
            return $event;
        }

        $statuses = $auctions
            ->map(fn ($auction) => $auction->status instanceof AuctionStatus ? $auction->status : AuctionStatus::from($auction->status))
            ->values();

        $status = match (true) {
            $statuses->contains(AuctionStatus::Live) => AuctionStatus::Live,
            $statuses->every(fn (AuctionStatus $status) => $status === AuctionStatus::Cancelled) => AuctionStatus::Cancelled,
            $statuses->every(fn (AuctionStatus $status) => $status === AuctionStatus::Closed) => AuctionStatus::Closed,
            $statuses->contains(AuctionStatus::Scheduled) => AuctionStatus::Scheduled,
            $statuses->every(fn (AuctionStatus $status) => $status === AuctionStatus::Draft) => AuctionStatus::Draft,
            default => AuctionStatus::Draft,
        };

        $firstAuction = $auctions->sortBy('sequence')->first();
        $closedAt = in_array($status, [AuctionStatus::Closed, AuctionStatus::Cancelled], true)
            ? $auctions->pluck('closed_at')->filter()->max()
            : null;

        $event->update([
            'status' => $status,
            'starts_at' => $auctions->min('starts_at') ?? $event->starts_at,
            'ends_at' => $auctions->max('ends_at') ?? $event->ends_at,
            'hero_image_url' => $firstAuction?->hero_image_url ?? $event->hero_image_url,
            'closed_at' => $closedAt,
        ]);

        return $event->fresh('auctions');
    }
}
