<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'assigned_to' => null,
            'title' => fake()->sentence(4),
            'status' => fake()->randomElement(['new', 'contacted', 'interested', 'negotiating', 'won', 'lost']),
            'source' => fake()->randomElement(['referral', 'web', 'social', 'walk_in', 'other']),
            'product_interest' => fake()->optional(0.6)->words(3, true),
            'expected_value' => fake()->optional(0.5)->randomFloat(2, 100, 50000),
            'notes' => fake()->optional(0.4)->paragraph(),
            'closed_at' => null,
        ];
    }

    public function won(): static
    {
        return $this->state([
            'status' => 'won',
            'closed_at' => now(),
        ]);
    }

    public function lost(): static
    {
        return $this->state([
            'status' => 'lost',
            'closed_at' => now(),
        ]);
    }

    public function assignedTo(User $user): static
    {
        return $this->state(['assigned_to' => $user->id]);
    }
}
