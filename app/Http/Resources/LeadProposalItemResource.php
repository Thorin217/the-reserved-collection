<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadProposalItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lead_proposal_id' => $this->lead_proposal_id,
            'product_id' => $this->product_id,
            'product_variant_id' => $this->product_variant_id,
            'product_serial_id' => $this->product_serial_id,
            'name' => $this->name,
            'model' => $this->model,
            'suggested_price' => $this->suggested_price,
            'description' => $this->description,
            'notes' => $this->notes,
            'created_at' => $this->created_at,

            'product' => ProductResource::make($this->whenLoaded('product')),
            'variant' => ProductVariantResource::make($this->whenLoaded('variant')),
            'serial' => ProductSerialResource::make($this->whenLoaded('serial')),
        ];
    }
}
