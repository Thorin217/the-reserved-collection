<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WarehouseResource extends JsonResource
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
            'branch_id' => $this->branch_id,
            'name' => $this->name,
            'type' => $this->type,
            'allows_sales' => $this->allows_sales,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'is_default' => $this->is_default,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'branch' => BranchResource::make($this->whenLoaded('branch')),
            'inventory_adjustments' => InventoryAdjustmentResource::collection($this->whenLoaded('inventoryAdjustments')),
            'inventory_movements' => InventoryMovementResource::collection($this->whenLoaded('inventoryMovements')),
            'inventory_reservations' => InventoryReservationResource::collection($this->whenLoaded('inventoryReservations')),
            'inventory_stocks' => InventoryStockResource::collection($this->whenLoaded('inventoryStocks')),
            'product_serials' => ProductSerialResource::collection($this->whenLoaded('productSerials')),
            'outgoing_transfers' => InventoryTransferResource::collection($this->whenLoaded('outgoingTransfers')),
            'incoming_transfers' => InventoryTransferResource::collection($this->whenLoaded('incomingTransfers')),
        ];
    }
}
