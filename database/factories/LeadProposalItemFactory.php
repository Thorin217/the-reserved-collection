<?php

namespace Database\Factories;

use App\Models\LeadProposal;
use App\Models\LeadProposalItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadProposalItem>
 */
class LeadProposalItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'lead_proposal_id' => LeadProposal::factory(),
            'product_id' => Product::factory(),
            'product_variant_id' => null,
            'product_serial_id' => null,
            'name' => fake()->words(3, true),
            'model' => fake()->optional(0.5)->words(2, true),
            'suggested_price' => fake()->randomFloat(2, 500, 30000),
            'description' => fake()->optional(0.6)->sentence(),
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }
}
