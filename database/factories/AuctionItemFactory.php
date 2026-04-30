<?php

namespace Database\Factories;

use App\Models\Auction;
use App\Models\AuctionItem;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuctionItem>
 */
class AuctionItemFactory extends Factory
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

        return [
            'auction_id' => Auction::factory(),
            'position' => 1,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'product_serial_id' => null,
            'inventory_source_type' => $product->product_type->value,
            'reference_price' => $variant->price,
            'snapshot' => [
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
