<?php

namespace Database\Factories;

use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\AuctionEvent;
use App\Models\AuctionItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Auction>
 */
class AuctionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startingPrice = fake()->randomFloat(2, 1000, 10000);
        $title = fake()->words(3, true).' Lot';

        return [
            'auction_event_id' => AuctionEvent::factory(),
            'sequence' => 1,
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'description' => fake()->sentence(),
            'status' => AuctionStatus::Draft,
            'closure_result' => null,
            'inventory_source_type' => 'variant',
            'lot_number' => 'LOT-'.strtoupper(fake()->unique()->bothify('######')),
            'hero_image_url' => null,
            'starting_price' => $startingPrice,
            'reserve_price' => $startingPrice + 500,
            'minimum_increment' => 100,
            'current_bid_amount' => null,
            'current_bid_user_id' => null,
            'winning_bid_id' => null,
            'winner_user_id' => null,
            'hammer_price' => null,
            'total_due' => null,
            'starts_at' => now()->addHour(),
            'ends_at' => now()->addDay(),
            'closed_at' => null,
            'is_manually_closed' => false,
            'created_by' => User::factory()->admin(),
            'closed_by' => null,
            'inventory_snapshot' => null,
            'notes' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Auction $auction): void {
            if ($auction->items()->exists()) {
                return;
            }

            $item = AuctionItem::factory()->create([
                'auction_id' => $auction->id,
                'position' => 1,
            ]);

            $auction->update([
                'inventory_source_type' => $auction->inventory_source_type ?: $item->inventory_source_type,
                'hero_image_url' => $auction->hero_image_url ?: data_get($item->snapshot, 'image_url'),
                'inventory_snapshot' => $auction->inventory_snapshot ?: $item->snapshot,
            ]);

            $event = $auction->event()->first();

            if (
                $event !== null
                && $event->format === AuctionEventFormat::Lot
                && $event->auctions()->count() === 1
            ) {
                $auction->event()->update([
                    'title' => $auction->title,
                    'slug' => $auction->slug,
                    'description' => $auction->description,
                    'status' => $auction->status,
                    'starts_at' => $auction->starts_at,
                    'ends_at' => $auction->ends_at,
                    'hero_image_url' => $auction->hero_image_url,
                    'notes' => $auction->notes,
                    'created_by' => $auction->created_by,
                    'closed_by' => $auction->closed_by,
                    'closed_at' => $auction->closed_at,
                ]);
            }
        });
    }
}
