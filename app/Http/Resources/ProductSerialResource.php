<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductSerialResource extends JsonResource
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
            'product_variant_id' => $this->product_variant_id,
            'serial_number' => $this->serial_number,
            'imei_or_reference' => $this->imei_or_reference,
            'warehouse_id' => $this->warehouse_id,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'product_variant' => ProductVariantResource::make($this->whenLoaded('productVariant')),
            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'inventory_movements' => InventoryMovementResource::collection($this->whenLoaded('inventoryMovements')),
            'attribute_values' => ProductAttributeValueResource::collection($this->whenLoaded('attributeValues')),
        ];
    }
}
