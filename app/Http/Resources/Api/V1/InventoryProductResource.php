<?php

namespace App\Http\Resources\Api\V1;

use App\Models\InventoryStock;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $stockRecords = $this->whenLoaded('inventoryStocks');
        $variantRecords = $this->whenLoaded('variants');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'slug' => $this->slug,
            'description' => $this->description,
            'product_type' => $this->product_type?->value ?? $this->product_type,
            'track_stock' => $this->track_stock,
            'has_serial_numbers' => $this->has_serial_numbers,
            'status' => $this->status?->value ?? $this->status,
            'image_url' => $this->getFirstMediaUrl('product'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'brand' => $this->whenLoaded('brand', fn (): array => [
                'id' => $this->brand?->id,
                'name' => $this->brand?->name,
            ]),
            'category' => $this->whenLoaded('category', fn (): array => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
            ]),
            'stock_summary' => [
                'total_quantity' => (float) ($this->inventory_stocks_sum_quantity ?? 0),
                'reserved_quantity' => (float) ($this->inventory_stocks_sum_reserved_quantity ?? 0),
                'available_quantity' => (float) ($this->inventory_stocks_sum_available_quantity ?? 0),
            ],
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(
                fn (ProductVariant $variant): array => [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'barcode' => $variant->barcode,
                    'attribute_summary' => $variant->attribute_summary,
                    'cost' => $variant->cost,
                    'price' => $variant->price,
                    'compare_price' => $variant->compare_price,
                    'is_active' => $variant->is_active,
                    'stock_summary' => [
                        'total_quantity' => (float) $variant->inventoryStocks->sum('quantity'),
                        'reserved_quantity' => (float) $variant->inventoryStocks->sum('reserved_quantity'),
                        'available_quantity' => (float) $variant->inventoryStocks->sum('available_quantity'),
                    ],
                ]
            )->values()),
            'stocks' => $this->whenLoaded('inventoryStocks', fn () => $this->inventoryStocks->map(
                fn (InventoryStock $stock): array => [
                    'id' => $stock->id,
                    'warehouse_id' => $stock->warehouse_id,
                    'warehouse_name' => $stock->warehouse?->name,
                    'product_variant_id' => $stock->product_variant_id,
                    'quantity' => (float) $stock->quantity,
                    'reserved_quantity' => (float) $stock->reserved_quantity,
                    'available_quantity' => (float) $stock->available_quantity,
                    'average_cost' => $stock->average_cost !== null ? (float) $stock->average_cost : null,
                ]
            )->values()),
        ];
    }
}
