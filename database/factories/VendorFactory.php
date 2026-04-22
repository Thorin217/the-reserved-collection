<?php

namespace Database\Factories;

use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vendor>
 */
class VendorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'email' => fake()->optional(0.7)->companyEmail(),
            'phone' => fake()->optional(0.6)->phoneNumber(),
            'tax_id' => fake()->optional(0.5)->numerify('##########'),
            'contact_person' => fake()->optional(0.5)->name(),
            'address' => fake()->optional(0.4)->address(),
            'notes' => fake()->optional(0.2)->sentence(),
            'is_active' => true,
        ];
    }
}
