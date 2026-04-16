<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'lead_id' => $this->lead_id,
            'negotiation_id' => $this->negotiation_id,
            'user_id' => $this->user_id,
            'quote_number' => $this->quote_number,
            'status' => $this->status,
            'currency' => $this->currency,
            'issued_at' => $this->issued_at,
            'expires_at' => $this->expires_at,
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'total' => $this->total,
            'notes' => $this->notes,
            'approved_at' => $this->approved_at,
            'items_count' => $this->whenCounted('items'),
            'linked_sale_id' => $this->whenLoaded('sales', function (): ?int {
                return $this->sales
                    ->sortByDesc('id')
                    ->first()?->id;
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'client' => ClientResource::make($this->whenLoaded('client')),
            'lead' => LeadResource::make($this->whenLoaded('lead')),
            'negotiation' => NegotiationResource::make($this->whenLoaded('negotiation')),
            'user' => UserResource::make($this->whenLoaded('user')),
            'items' => QuoteItemResource::collection($this->whenLoaded('items')),
            'can' => $this->when($request->user() !== null, fn (): array => [
                'update' => $request->user()->can('update', $this->resource),
                'delete' => $request->user()->can('delete', $this->resource),
                'convert_to_sale' => $request->user()->can('convertToSale', $this->resource),
            ]),
        ];
    }
}
