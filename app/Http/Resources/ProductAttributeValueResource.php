<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductAttributeValueResource extends JsonResource
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
            'product_variant_id' => $this->product_variant_id,
            'product_serial_id' => $this->product_serial_id,
            'attribute_id' => $this->attribute_id,
            'value_text' => $this->value_text,
            'value_textarea' => $this->value_textarea,
            'value_number' => $this->value_number,
            'value_decimal' => $this->value_decimal,
            'value_boolean' => $this->value_boolean,
            'value_date' => $this->value_date,
            'attribute_option_id' => $this->attribute_option_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'product' => ProductResource::make($this->whenLoaded('product')),
            'product_variant' => ProductVariantResource::make($this->whenLoaded('productVariant')),
            'product_serial' => ProductSerialResource::make($this->whenLoaded('productSerial')),
            'attribute' => AttributeResource::make($this->whenLoaded('attribute')),
            'attribute_option' => AttributeOptionResource::make($this->whenLoaded('attributeOption')),
        ];
    }
}
