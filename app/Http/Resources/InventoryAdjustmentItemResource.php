<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryAdjustmentItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'adjustment_id' => $this->adjustment_id,
            'product_variant_id' => $this->product_variant_id,
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'adjustment' => InventoryAdjustmentResource::make($this->whenLoaded('adjustment')),
            'product_variant' => ProductVariantResource::make($this->whenLoaded('productVariant')),
        ];
    }
}
