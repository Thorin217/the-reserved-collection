<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quote_id' => $this->quote_id,
            'product_variant_id' => $this->product_variant_id,
            'product_serial_id' => $this->product_serial_id,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'line_total' => $this->line_total,
            'notes' => $this->notes,
            'product_variant' => ProductVariantResource::make($this->whenLoaded('productVariant')),
            'product_serial' => ProductSerialResource::make($this->whenLoaded('productSerial')),
        ];
    }
}
