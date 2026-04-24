<?php

namespace Database\Factories;

use App\Models\Auction;
use App\Models\AuctionBid;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuctionBid>
 */
class AuctionBidFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'auction_id' => Auction::factory(),
            'user_id' => User::factory()->customer(),
            'amount' => fake()->randomFloat(2, 1000, 10000),
            'placed_at' => now(),
            'is_winning' => false,
        ];
    }
}
