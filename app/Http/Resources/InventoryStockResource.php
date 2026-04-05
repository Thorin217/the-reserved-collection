<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryStockResource extends JsonResource
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
            'warehouse_id' => $this->warehouse_id,
            'product_variant_id' => $this->product_variant_id,
            'quantity' => $this->quantity,
            'reserved_quantity' => $this->reserved_quantity,
            'available_quantity' => $this->available_quantity,
            'average_cost' => $this->average_cost,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'product_variant' => ProductVariantResource::make($this->whenLoaded('productVariant')),
        ];
    }
}
