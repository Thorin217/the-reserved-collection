<?php

namespace Database\Factories;

use App\Enums\NegotiationStatus;
use App\Models\Lead;
use App\Models\Negotiation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Negotiation>
 */
class NegotiationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'lead_id' => Lead::factory(),
            'lead_proposal_id' => null,
            'user_id' => User::factory(),
            'status' => NegotiationStatus::Negotiating->value,
            'initial_price' => fake()->randomFloat(2, 500, 50000),
            'final_price' => null,
            'notes' => fake()->optional(0.4)->paragraph(),
            'agreed_at' => null,
        ];
    }

    public function agreed(): static
    {
        $initialPrice = fake()->randomFloat(2, 500, 50000);

        return $this->state([
            'status' => NegotiationStatus::Agreed->value,
            'initial_price' => $initialPrice,
            'final_price' => $initialPrice * fake()->randomFloat(2, 0.8, 1.0),
            'agreed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state([
            'status' => NegotiationStatus::Rejected->value,
        ]);
    }
}
