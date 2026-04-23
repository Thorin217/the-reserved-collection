<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vendor_id' => $this->vendor_id,
            'vendor_name' => $this->resolvedVendorName(),
            'warehouse_id' => $this->warehouse_id,
            'user_id' => $this->user_id,
            'purchase_number' => $this->purchase_number,
            'reference' => $this->reference,
            'status' => $this->status,
            'currency' => $this->currency,
            'purchased_at' => $this->purchased_at,
            'subtotal' => $this->subtotal,
            'tax_total' => $this->tax_total,
            'discount_total' => $this->discount_total,
            'total' => $this->total,
            'balance_due' => $this->balance_due,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'vendor' => VendorResource::make($this->whenLoaded('vendor')),
            'warehouse' => WarehouseResource::make($this->whenLoaded('warehouse')),
            'user' => UserResource::make($this->whenLoaded('user')),
            'items' => PurchaseItemResource::collection($this->whenLoaded('items')),
            'payable' => AccountPayableResource::make($this->whenLoaded('payable')),
        ];
    }
}
