<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\Quote;
use App\Models\QuoteItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuoteItem>
 */
class QuoteItemFactory extends Factory
{
    public function definition(): array
    {
        $unitPrice = fake()->randomFloat(2, 500, 50000);
        $quantity = fake()->randomFloat(2, 1, 3);

        return [
            'quote_id' => Quote::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'product_serial_id' => null,
            'description' => fake()->sentence(3),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'line_total' => $unitPrice * $quantity,
            'notes' => fake()->optional(0.4)->sentence(),
        ];
    }
}
