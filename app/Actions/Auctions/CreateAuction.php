<?php

namespace App\Actions\Auctions;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateAuction
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(array $validated, User $user): Auction
    {
        return DB::transaction(function () use ($validated, $user): Auction {
            $variant = ProductVariant::query()
                ->with(['product.brand', 'product.category'])
                ->findOrFail($validated['product_variant_id']);

            $serial = isset($validated['product_serial_id'])
                ? ProductSerial::query()->findOrFail($validated['product_serial_id'])
                : null;

            $auction = Auction::query()->create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']).'-'.Str::lower(Str::random(6)),
                'description' => $validated['description'] ?? null,
                'status' => AuctionStatus::Draft,
                'product_id' => $variant->product_id,
                'product_variant_id' => $variant->id,
                'product_serial_id' => $serial?->id,
                'inventory_source_type' => $serial ? 'serial' : $variant->product->product_type->value,
                'lot_number' => 'LOT-TMP-'.Str::upper(Str::random(10)),
                'starting_price' => $validated['starting_price'],
                'reserve_price' => $validated['reserve_price'] ?? null,
                'minimum_increment' => $validated['minimum_increment'],
                'starts_at' => $validated['starts_at'],
                'ends_at' => $validated['ends_at'],
                'created_by' => $user->id,
                'inventory_snapshot' => $this->buildInventorySnapshot($variant, $serial),
                'notes' => $validated['notes'] ?? null,
            ]);

            $auction->update([
                'lot_number' => 'LOT-'.str_pad((string) $auction->id, 6, '0', STR_PAD_LEFT),
            ]);

            return $auction->fresh([
                'product.brand',
                'product.category',
                'productVariant',
                'productSerial',
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
}
