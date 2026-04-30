<?php

namespace App\Actions\Auctions;

use App\Models\Auction;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class UpdateAuction
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(Auction $auction, array $validated): Auction
    {
        return DB::transaction(function () use ($auction, $validated): Auction {
            $items = collect($validated['items'])
                ->values()
                ->map(function (array $item, int $index): array {
                    $variant = ProductVariant::query()
                        ->with(['product.brand', 'product.category'])
                        ->findOrFail($item['product_variant_id']);

                    $serial = isset($item['product_serial_id'])
                        ? ProductSerial::query()->findOrFail($item['product_serial_id'])
                        : null;

                    return [
                        'position' => $index + 1,
                        'product_id' => $variant->product_id,
                        'product_variant_id' => $variant->id,
                        'product_serial_id' => $serial?->id,
                        'inventory_source_type' => $serial ? 'serial' : $variant->product->product_type->value,
                        'reference_price' => $variant->price,
                        'snapshot' => $this->buildInventorySnapshot($variant, $serial),
                        'notes' => $item['notes'] ?? null,
                    ];
                });

            $primaryItem = $items->firstOrFail();

            $auction->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'inventory_source_type' => $this->resolveInventorySourceType($items->pluck('inventory_source_type')->all()),
                'hero_image_url' => data_get($primaryItem, 'snapshot.image_url'),
                'starting_price' => $validated['starting_price'],
                'reserve_price' => $validated['reserve_price'] ?? null,
                'minimum_increment' => $validated['minimum_increment'],
                'starts_at' => $validated['starts_at'],
                'ends_at' => $validated['ends_at'],
                'inventory_snapshot' => $primaryItem['snapshot'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $auction->items()->delete();
            $auction->items()->createMany($items->all());

            return $auction->fresh([
                'items.product.brand',
                'items.product.category',
                'items.productVariant',
                'items.productSerial',
                'creator',
            ]);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function buildInventorySnapshot(ProductVariant $variant, ?ProductSerial $serial): array
    {
        $product = $variant->product;

        return [
            'product_name' => $product->name,
            'product_slug' => $product->slug,
            'brand_name' => $product->brand?->name,
            'category_name' => $product->category?->name,
            'product_sku' => $product->sku,
            'variant_sku' => $variant->sku,
            'serial_number' => $serial?->serial_number,
            'image_url' => $product->getFirstMediaUrl('product'),
            'price_reference' => $variant->price,
            'product_type' => $product->product_type->value,
            'has_serial_numbers' => $product->has_serial_numbers,
            'attribute_summary' => $variant->attribute_summary,
        ];
    }

    /**
     * @param  array<int, string>  $sourceTypes
     */
    private function resolveInventorySourceType(array $sourceTypes): string
    {
        $uniqueSourceTypes = array_values(array_unique($sourceTypes));

        if (count($uniqueSourceTypes) === 1) {
            return $uniqueSourceTypes[0];
        }

        return 'mixed';
    }
}
