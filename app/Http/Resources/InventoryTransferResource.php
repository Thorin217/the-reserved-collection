<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryTransferResource extends JsonResource
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
            'from_warehouse_id' => $this->from_warehouse_id,
            'to_warehouse_id' => $this->to_warehouse_id,
            'status' => $this->status,
            'requested_by' => $this->requested_by,
            'approved_by' => $this->approved_by,
            'received_by' => $this->received_by,
            'notes' => $this->notes,
            'sent_at' => $this->sent_at,
            'received_at' => $this->received_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'from_warehouse' => WarehouseResource::make($this->whenLoaded('fromWarehouse')),
            'to_warehouse' => WarehouseResource::make($this->whenLoaded('toWarehouse')),
            'requester' => UserResource::make($this->whenLoaded('requester')),
            'approver' => UserResource::make($this->whenLoaded('approver')),
            'receiver' => UserResource::make($this->whenLoaded('receiver')),
            'items' => InventoryTransferItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
