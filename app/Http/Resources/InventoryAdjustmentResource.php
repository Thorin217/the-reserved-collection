<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryAdjustmentResource extends JsonResource
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
            'code' => $this->code,
            'warehouse_id' => $this->warehouse_id,
            'adjustment_type' => $this->adjustment_type,
            'reason' => $this->reason,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'confirmed_by' => $this->confirmed_by,
            'confirmed_at' => $this->confirmed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'creator' => UserResource::make($this->whenLoaded('creator')),
            'confirmer' => UserResource::make($this->whenLoaded('confirmer')),
            'items' => InventoryAdjustmentItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
