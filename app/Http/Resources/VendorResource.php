<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'tax_id' => $this->tax_id,
            'contact_person' => $this->contact_person,
            'address' => $this->address,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'payables_count' => $this->whenCounted('payables'),
            'created_at' => $this->created_at,
        ];
    }
}
