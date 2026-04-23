<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_id' => $this->purchase_id,
            'product_variant_id' => $this->product_variant_id,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
            'line_total' => $this->line_total,
            'product_variant' => $this->whenLoaded('productVariant', fn () => $this->productVariant ? [
                'id' => $this->productVariant->id,
                'sku' => $this->productVariant->sku,
                'attribute_summary' => $this->productVariant->attribute_summary ?? null,
                'product' => $this->productVariant->relationLoaded('product') ? [
                    'name' => $this->productVariant->product?->name,
                    'brand' => $this->productVariant->product?->brand ? [
                        'name' => $this->productVariant->product->brand->name,
                    ] : null,
                ] : null,
            ] : null),
        ];
    }
}
