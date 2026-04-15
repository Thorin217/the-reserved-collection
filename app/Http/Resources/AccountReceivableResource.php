<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountReceivableResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_id' => $this->sale_id,
            'client_id' => $this->client_id,
            'reference' => $this->reference,
            'status' => $this->status,
            'due_date' => $this->due_date,
            'amount' => $this->amount,
            'paid_amount' => $this->paid_amount,
            'balance_due' => $this->balance_due,
            'paid_at' => $this->paid_at,
            'notes' => $this->notes,
            'client' => ClientResource::make($this->whenLoaded('client')),
            'sale' => SaleResource::make($this->whenLoaded('sale')),
        ];
    }
}
