<?php

namespace App\Console\Commands;

use App\Actions\Auctions\StartAuction;
use App\Enums\AuctionStatus;
use App\Models\Auction;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('auctions:start-scheduled')]
#[Description('Command description')]
class StartScheduledAuctions extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $started = 0;
        $starter = app(StartAuction::class);

        Auction::query()
            ->where('status', AuctionStatus::Scheduled)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now())
            ->orderBy('starts_at')
            ->get()
            ->each(function (Auction $auction) use ($starter, &$started): void {
                $starter->handle($auction);
                $started++;
            });

        $this->info("Started {$started} auction(s).");

        return self::SUCCESS;
    }
}
