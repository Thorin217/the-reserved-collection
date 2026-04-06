<?php

namespace Database\Factories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Brand>
 */
class BrandFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $luxuryBrands = [
            'Rolex', 'Patek Philippe', 'Audemars Piguet', 'Cartier', 'IWC',
            'Omega', 'Breitling', 'TAG Heuer', 'Vacheron Constantin', 'Jaeger-LeCoultre',
            'A. Lange & Söhne', 'Panerai', 'Hublot', 'Richard Mille', 'Bulgari',
        ];
        $name = fake()->unique()->randomElement($luxuryBrands);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
