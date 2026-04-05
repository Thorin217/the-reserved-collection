<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryMovementResource extends JsonResource
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
            'movement_type' => $this->movement_type,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'branch_id' => $this->branch_id,
            'warehouse_id' => $this->warehouse_id,
            'product_variant_id' => $this->product_variant_id,
            'serial_id' => $this->serial_id,
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
            'balance_after_movement' => $this->balance_after_movement,
            'notes' => $this->notes,
            'user_id' => $this->user_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'reference' => $this->whenLoaded('reference'),
            'branch' => BranchResource::make($this->whenLoaded('branch')),
            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'product_variant' => ProductVariantResource::make($this->whenLoaded('productVariant')),
            'serial' => ProductSerialResource::make($this->whenLoaded('serial')),
            'user' => UserResource::make($this->whenLoaded('user')),
        ];
    }
}
