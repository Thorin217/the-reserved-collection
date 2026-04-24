<?php

namespace Database\Seeders;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use RuntimeException;

class AuctionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $creator = User::query()
            ->where('is_admin', true)
            ->first()
            ?? User::query()->first()
            ?? User::factory()->create([
                'name' => 'Auction Admin',
                'email' => 'auction-admin@example.com',
                'password' => 'password',
            ]);

        $bidders = collect([
            $this->firstOrCreateUser('client@client.com', 'Client'),
            $this->firstOrCreateUser('collectorprime@example.com', 'CollectorPrime'),
            $this->firstOrCreateUser('luxbidder@example.com', 'LuxBidder'),
            $this->firstOrCreateUser('timepiecehq@example.com', 'TimepieceHQ'),
            $this->firstOrCreateUser('silentbid99@example.com', 'SilentBid99'),
        ])->keyBy('email');

        $definitions = [
            [
                'slug' => 'nautilus-5711-live-auction',
                'product_sku' => 'PP-NAUT-5711',
                'status' => AuctionStatus::Live,
                'lot_number' => 'LOT-AUC-001',
                'starting_ratio' => 0.92,
                'reserve_ratio' => 1.00,
                'increment' => 500,
                'starts_at' => now()->subMinutes(45),
                'ends_at' => now()->addHours(2),
                'bidder_sequence' => [
                    ['email' => 'collectorprime@example.com', 'increment_steps' => 0],
                    ['email' => 'luxbidder@example.com', 'increment_steps' => 3],
                    ['email' => 'client@client.com', 'increment_steps' => 6],
                    ['email' => 'timepiecehq@example.com', 'increment_steps' => 9],
                ],
            ],
            [
                'slug' => 'royal-oak-offshore-live-auction',
                'product_sku' => 'AP-ROO-26420SO',
                'status' => AuctionStatus::Live,
                'lot_number' => 'LOT-AUC-002',
                'starting_ratio' => 0.90,
                'reserve_ratio' => 1.00,
                'increment' => 500,
                'starts_at' => now()->subMinutes(30),
                'ends_at' => now()->addMinutes(95),
                'bidder_sequence' => [
                    ['email' => 'luxbidder@example.com', 'increment_steps' => 0],
                    ['email' => 'client@client.com', 'increment_steps' => 2],
                    ['email' => 'silentbid99@example.com', 'increment_steps' => 5],
                    ['email' => 'collectorprime@example.com', 'increment_steps' => 8],
                ],
            ],
            [
                'slug' => 'daytona-live-auction',
                'product_sku' => 'ROL-DAYT-116500LN',
                'status' => AuctionStatus::Live,
                'lot_number' => 'LOT-AUC-003',
                'starting_ratio' => 0.91,
                'reserve_ratio' => 1.00,
                'increment' => 250,
                'starts_at' => now()->subHour(),
                'ends_at' => now()->addMinutes(70),
                'bidder_sequence' => [
                    ['email' => 'timepiecehq@example.com', 'increment_steps' => 0],
                    ['email' => 'client@client.com', 'increment_steps' => 3],
                    ['email' => 'luxbidder@example.com', 'increment_steps' => 6],
                ],
            ],
            [
                'slug' => 'apollo-11-live-auction',
                'product_sku' => 'OM-SPEED-AP11-50TH',
                'status' => AuctionStatus::Live,
                'lot_number' => 'LOT-AUC-004',
                'starting_ratio' => 0.88,
                'reserve_ratio' => 1.00,
                'increment' => 200,
                'starts_at' => now()->subMinutes(20),
                'ends_at' => now()->addMinutes(140),
                'bidder_sequence' => [
                    ['email' => 'silentbid99@example.com', 'increment_steps' => 0],
                    ['email' => 'client@client.com', 'increment_steps' => 2],
                    ['email' => 'collectorprime@example.com', 'increment_steps' => 5],
                ],
            ],
            [
                'slug' => 'birkin-upcoming-auction',
                'product_sku' => 'HER-BIRK-30-GOLD',
                'status' => AuctionStatus::Scheduled,
                'lot_number' => 'LOT-AUC-005',
                'starting_ratio' => 0.90,
                'reserve_ratio' => 1.00,
                'increment' => 500,
                'starts_at' => now()->addHours(6),
                'ends_at' => now()->addHours(10),
                'bidder_sequence' => [],
            ],
            [
                'slug' => 'calatrava-upcoming-auction',
                'product_sku' => 'PP-CAL-5212A',
                'status' => AuctionStatus::Scheduled,
                'lot_number' => 'LOT-AUC-006',
                'starting_ratio' => 0.89,
                'reserve_ratio' => 1.00,
                'increment' => 500,
                'starts_at' => now()->addDay(),
                'ends_at' => now()->addDay()->addHours(4),
                'bidder_sequence' => [],
            ],
        ];

        $variants = ProductVariant::query()
            ->with(['product.brand', 'product.category', 'product.media'])
            ->whereHas('product', fn ($query) => $query->whereIn('sku', collect($definitions)->pluck('product_sku')))
            ->get()
            ->keyBy(fn (ProductVariant $variant) => $variant->product->sku);

        $missingProducts = collect($definitions)
            ->pluck('product_sku')
            ->filter(fn (string $sku) => ! $variants->has($sku))
            ->values();

        if ($missingProducts->isNotEmpty()) {
            throw new RuntimeException('AuctionSeeder requires seeded products for SKUs: '.$missingProducts->implode(', '));
        }

        foreach ($definitions as $definition) {
            $variant = $variants->get($definition['product_sku']);
            $product = $variant->product;
            $startingPrice = round((float) $variant->price * $definition['starting_ratio'], 2);
            $reservePrice = round((float) $variant->price * $definition['reserve_ratio'], 2);

            $auction = Auction::query()->updateOrCreate(
                ['slug' => $definition['slug']],
                [
                    'title' => $product->name,
                    'description' => $product->description,
                    'status' => $definition['status'],
                    'closure_result' => null,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'product_serial_id' => null,
                    'inventory_source_type' => $product->product_type->value,
                    'lot_number' => $definition['lot_number'],
                    'starting_price' => $startingPrice,
                    'reserve_price' => $reservePrice,
                    'minimum_increment' => $definition['increment'],
                    'current_bid_amount' => null,
                    'current_bid_user_id' => null,
                    'winning_bid_id' => null,
                    'winner_user_id' => null,
                    'hammer_price' => null,
                    'total_due' => null,
                    'starts_at' => $definition['starts_at'],
                    'ends_at' => $definition['ends_at'],
                    'closed_at' => null,
                    'is_manually_closed' => false,
                    'created_by' => $creator->id,
                    'closed_by' => null,
                    'inventory_snapshot' => $this->buildInventorySnapshot($variant),
                    'notes' => 'Demo auction seeded for portal and admin review.',
                ],
            );

            $this->syncAuctionBids($auction, $definition['bidder_sequence'], $bidders, $startingPrice, $definition['increment']);
        }
    }

    private function firstOrCreateUser(string $email, string $name): User
    {
        return User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );
    }

    /**
     * @param  array<int, array{email: string, increment_steps: int}>  $bidderSequence
     * @param  Collection<string, User>  $bidders
     */
    private function syncAuctionBids(Auction $auction, array $bidderSequence, Collection $bidders, float $startingPrice, float $increment): void
    {
        $auction->bids()->delete();

        if ($bidderSequence === []) {
            $auction->update([
                'current_bid_amount' => null,
                'current_bid_user_id' => null,
                'winning_bid_id' => null,
                'winner_user_id' => null,
                'hammer_price' => null,
                'total_due' => null,
            ]);

            return;
        }

        $winningBidId = null;
        $winningUserId = null;
        $currentBidAmount = null;

        foreach ($bidderSequence as $index => $bidDefinition) {
            $bidAmount = round($startingPrice + ($increment * $bidDefinition['increment_steps']), 2);
            $bidder = $bidders->get($bidDefinition['email']);

            $bid = $auction->bids()->create([
                'user_id' => $bidder->id,
                'amount' => $bidAmount,
                'placed_at' => Carbon::parse($auction->starts_at)->addMinutes(($index + 1) * 8),
                'is_winning' => false,
            ]);

            $winningBidId = $bid->id;
            $winningUserId = $bidder->id;
            $currentBidAmount = $bidAmount;
        }

        $auction->bids()->whereKey($winningBidId)->update(['is_winning' => true]);

        $auction->update([
            'current_bid_amount' => $currentBidAmount,
            'current_bid_user_id' => $winningUserId,
            'winning_bid_id' => null,
            'winner_user_id' => null,
            'hammer_price' => null,
            'total_due' => null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildInventorySnapshot(ProductVariant $variant): array
    {
        $product = $variant->product;

        return [
            'product_name' => $product->name,
            'product_slug' => $product->slug,
            'brand_name' => $product->brand?->name,
            'category_name' => $product->category?->name,
            'product_sku' => $product->sku,
            'variant_sku' => $variant->sku,
            'serial_number' => null,
            'image_url' => $product->getFirstMediaUrl('product'),
            'price_reference' => $variant->price,
            'product_type' => $product->product_type->value,
            'has_serial_numbers' => $product->has_serial_numbers,
            'attribute_summary' => $variant->attribute_summary,
        ];
    }
}
