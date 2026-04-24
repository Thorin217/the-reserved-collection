<?php

namespace App\Console\Commands;

use App\Actions\Auctions\CloseAuction;
use App\Enums\AuctionStatus;
use App\Models\Auction;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('auctions:close-expired')]
#[Description('Command description')]
class CloseExpiredAuctions extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $closed = 0;
        $closer = app(CloseAuction::class);

        Auction::query()
            ->where('status', AuctionStatus::Live)
            ->where('ends_at', '<=', now())
            ->orderBy('ends_at')
            ->get()
            ->each(function (Auction $auction) use ($closer, &$closed): void {
                $closer->handle($auction);
                $closed++;
            });

        $this->info("Closed {$closed} auction(s).");

        return self::SUCCESS;
    }
}
