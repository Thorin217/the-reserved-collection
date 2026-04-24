<?php

namespace Database\Factories;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Auction>
 */
class AuctionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $variant = ProductVariant::factory()->create();
        $product = $variant->product;
        $startingPrice = fake()->randomFloat(2, 1000, 10000);

        return [
            'title' => $product->name,
            'slug' => Str::slug($product->name).'-'.Str::lower(Str::random(6)),
            'description' => fake()->sentence(),
            'status' => AuctionStatus::Draft,
            'closure_result' => null,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'product_serial_id' => null,
            'inventory_source_type' => $product->product_type->value,
            'lot_number' => 'LOT-'.strtoupper(fake()->unique()->bothify('######')),
            'starting_price' => $startingPrice,
            'reserve_price' => $startingPrice + 500,
            'minimum_increment' => 100,
            'current_bid_amount' => null,
            'current_bid_user_id' => null,
            'winning_bid_id' => null,
            'winner_user_id' => null,
            'hammer_price' => null,
            'total_due' => null,
            'starts_at' => now()->addHour(),
            'ends_at' => now()->addDay(),
            'closed_at' => null,
            'is_manually_closed' => false,
            'created_by' => User::factory()->admin(),
            'closed_by' => null,
            'inventory_snapshot' => [
                'product_name' => $product->name,
                'product_slug' => $product->slug,
                'brand_name' => $product->brand?->name,
                'category_name' => $product->category?->name,
                'product_sku' => $product->sku,
                'variant_sku' => $variant->sku,
                'serial_number' => null,
                'image_url' => null,
                'price_reference' => $variant->price,
                'product_type' => $product->product_type->value,
                'has_serial_numbers' => $product->has_serial_numbers,
                'attribute_summary' => $variant->attribute_summary,
            ],
            'notes' => null,
        ];
    }
}
