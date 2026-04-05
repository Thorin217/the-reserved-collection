<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryTransferItemResource extends JsonResource
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
            'inventory_transfer_id' => $this->inventory_transfer_id,
            'product_variant_id' => $this->product_variant_id,
            'quantity' => $this->quantity,
            'received_quantity' => $this->received_quantity,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'inventory_transfer' => InventoryTransferResource::make($this->whenLoaded('inventoryTransfer')),
            'product_variant' => ProductVariantResource::make($this->whenLoaded('productVariant')),
        ];
    }
}
