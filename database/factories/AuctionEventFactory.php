<?php

namespace Database\Factories;

use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use App\Models\AuctionEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AuctionEvent>
 */
class AuctionEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->words(3, true).' Event';

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'description' => fake()->sentence(),
            'format' => AuctionEventFormat::Lot,
            'status' => AuctionStatus::Draft,
            'starts_at' => now()->addHour(),
            'ends_at' => now()->addDay(),
            'hero_image_url' => null,
            'notes' => null,
            'created_by' => User::factory()->admin(),
            'closed_by' => null,
            'closed_at' => null,
        ];
    }
}
