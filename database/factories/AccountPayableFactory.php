<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\AccountPayable;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AccountPayable>
 */
class AccountPayableFactory extends Factory
{
    public function definition(): array
    {
        $amount = fake()->randomFloat(2, 300, 40000);

        return [
            'sale_id' => null,
            'user_id' => User::factory(),
            'vendor_name' => fake()->company(),
            'reference' => strtoupper(fake()->bothify('AP-######')),
            'status' => PaymentStatus::Pending->value,
            'due_date' => now()->addDays(30)->toDateString(),
            'amount' => $amount,
            'paid_amount' => 0,
            'balance_due' => $amount,
            'paid_at' => null,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }
}
