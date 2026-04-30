<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuctionItemResource extends JsonResource
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
            'auction_id' => $this->auction_id,
            'position' => $this->position,
            'product_id' => $this->product_id,
            'product_variant_id' => $this->product_variant_id,
            'product_serial_id' => $this->product_serial_id,
            'inventory_source_type' => $this->inventory_source_type,
            'reference_price' => $this->reference_price,
            'snapshot' => $this->snapshot,
            'notes' => $this->notes,
        ];
    }
}
