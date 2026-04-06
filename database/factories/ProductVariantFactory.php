<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => strtoupper(fake()->unique()->bothify('VAR-???-####')),
            'barcode' => fake()->optional()->ean13(),
            'attribute_summary' => null,
            'cost' => fake()->randomFloat(2, 500, 50000),
            'price' => fake()->randomFloat(2, 1000, 100000),
            'compare_price' => null,
            'weight' => fake()->optional()->randomFloat(3, 0.05, 2),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
