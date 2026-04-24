<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
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
            'quote_id' => $this->quote_id,
            'negotiation_id' => $this->negotiation_id,
            'warehouse_id' => $this->warehouse_id,
            'user_id' => $this->user_id,
            'sale_number' => $this->sale_number,
            'status' => $this->status,
            'currency' => $this->currency,
            'payment_type' => $this->payment_type,
            'sold_at' => $this->sold_at,
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'total' => $this->total,
            'balance_due' => $this->balance_due,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'client' => ClientResource::make($this->whenLoaded('client')),
            'lead' => LeadResource::make($this->whenLoaded('lead')),
            'quote' => QuoteResource::make($this->whenLoaded('quote')),
            'negotiation' => NegotiationResource::make($this->whenLoaded('negotiation')),
            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'user' => UserResource::make($this->whenLoaded('user')),
            'items' => SaleItemResource::collection($this->whenLoaded('items')),
            'receivables' => AccountReceivableResource::collection($this->whenLoaded('receivables')),
            'can' => $this->when($request->user() !== null, fn (): array => [
                'update' => $request->user()->can('update', $this->resource),
                'confirm' => $request->user()->can('confirm', $this->resource),
                'cancel' => $request->user()->can('cancel', $this->resource),
            ]),
        ];
    }
}
