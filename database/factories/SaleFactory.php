<?php

namespace Database\Factories;

use App\Enums\SaleStatus;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    public function definition(): array
    {
        $total = fake()->randomFloat(2, 1000, 70000);

        return [
            'client_id' => Client::factory(),
            'lead_id' => Lead::factory(),
            'quote_id' => null,
            'negotiation_id' => null,
            'warehouse_id' => null,
            'user_id' => User::factory(),
            'sale_number' => strtoupper(fake()->unique()->bothify('S-######')),
            'status' => SaleStatus::Draft->value,
            'currency' => 'USD',
            'sold_at' => null,
            'subtotal' => $total,
            'tax_total' => 0,
            'discount_total' => 0,
            'total' => $total,
            'balance_due' => $total,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }
}
