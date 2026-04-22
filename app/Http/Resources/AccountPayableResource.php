<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountPayableResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_id' => $this->sale_id,
            'user_id' => $this->user_id,
            'vendor_name' => $this->vendor_name,
            'reference' => $this->reference,
            'status' => $this->status,
            'due_date' => $this->due_date,
            'amount' => $this->amount,
            'paid_amount' => $this->paid_amount,
            'balance_due' => $this->balance_due,
            'paid_at' => $this->paid_at,
            'notes' => $this->notes,
            'sale' => SaleResource::make($this->whenLoaded('sale')),
            'user' => UserResource::make($this->whenLoaded('user')),
            'vendor' => VendorResource::make($this->whenLoaded('vendor')),
            'payments' => PayablePaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
