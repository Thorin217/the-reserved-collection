<?php

namespace Database\Factories;

use App\Models\ProductSerial;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductSerial>
 */
class ProductSerialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_variant_id' => ProductVariant::factory(),
            'serial_number' => strtoupper(fake()->unique()->bothify('SN-??###???##')),
            'imei_or_reference' => fake()->optional()->bothify('REF-########'),
            'warehouse_id' => null,
            'status' => 'available',
        ];
    }

    public function available(): static
    {
        return $this->state(['status' => 'available']);
    }

    public function sold(): static
    {
        return $this->state(['status' => 'sold']);
    }

    public function reserved(): static
    {
        return $this->state(['status' => 'reserved']);
    }
}
