<?php

namespace Database\Factories;

use App\Enums\PurchaseStatus;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    public function definition(): array
    {
        static $sequence = 0;
        $sequence++;

        return [
            'vendor_id' => null,
            'vendor_name' => fake()->company(),
            'warehouse_id' => null,
            'user_id' => User::factory(),
            'purchase_number' => 'PO-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
            'reference' => strtoupper(fake()->bothify('INV-######')),
            'status' => PurchaseStatus::Draft,
            'currency' => 'USD',
            'purchased_at' => null,
            'subtotal' => 0,
            'tax_total' => 0,
            'discount_total' => 0,
            'total' => 0,
            'balance_due' => null,
            'notes' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn () => [
            'status' => PurchaseStatus::Confirmed,
            'purchased_at' => now(),
        ]);
    }
}
