<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
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
            'product_id' => $this->product_id,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'attribute_summary' => $this->attribute_summary,
            'cost' => $this->cost,
            'price' => $this->price,
            'compare_price' => $this->compare_price,
            'weight' => $this->weight,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'product' => ProductResource::make($this->whenLoaded('product')),
            'serials' => ProductSerialResource::collection($this->whenLoaded('serials')),
            'inventory_adjustment_items' => InventoryAdjustmentItemResource::collection($this->whenLoaded('inventoryAdjustmentItems')),
            'inventory_movements' => InventoryMovementResource::collection($this->whenLoaded('inventoryMovements')),
            'inventory_reservations' => InventoryReservationResource::collection($this->whenLoaded('inventoryReservations')),
            'inventory_stocks' => InventoryStockResource::collection($this->whenLoaded('inventoryStocks')),
            'inventory_transfer_items' => InventoryTransferItemResource::collection($this->whenLoaded('inventoryTransferItems')),
            'attribute_values' => ProductAttributeValueResource::collection($this->whenLoaded('attributeValues')),
        ];
    }
}
