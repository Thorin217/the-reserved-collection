<?php

namespace Database\Factories;

use App\Enums\QuoteStatus;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quote>
 */
class QuoteFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 500, 50000);

        return [
            'client_id' => Client::factory(),
            'lead_id' => Lead::factory(),
            'negotiation_id' => null,
            'user_id' => User::factory(),
            'quote_number' => strtoupper(fake()->unique()->bothify('Q-######')),
            'status' => QuoteStatus::Draft->value,
            'currency' => 'USD',
            'issued_at' => now()->toDateString(),
            'expires_at' => now()->addDays(7)->toDateString(),
            'subtotal' => $subtotal,
            'tax_total' => 0,
            'discount_total' => 0,
            'total' => $subtotal,
            'notes' => fake()->optional(0.4)->sentence(),
            'approved_at' => null,
        ];
    }
}
