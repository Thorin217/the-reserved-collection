<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\AccountReceivable;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AccountReceivable>
 */
class AccountReceivableFactory extends Factory
{
    public function definition(): array
    {
        $amount = fake()->randomFloat(2, 500, 50000);

        return [
            'sale_id' => null,
            'client_id' => Client::factory(),
            'reference' => strtoupper(fake()->bothify('AR-######')),
            'status' => PaymentStatus::Pending->value,
            'due_date' => now()->addDays(15)->toDateString(),
            'amount' => $amount,
            'paid_amount' => 0,
            'balance_due' => $amount,
            'paid_at' => null,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }
}
