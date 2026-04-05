<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryReservationResource extends JsonResource
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
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'quantity' => $this->quantity,
            'status' => $this->status,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'product_variant' => ProductVariantResource::make($this->whenLoaded('productVariant')),
            'reference' => $this->whenLoaded('reference'),
        ];
    }
}
