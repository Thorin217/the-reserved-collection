<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
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
            'document_type' => $this->document_type,
            'document_number' => $this->document_number,
            'address' => $this->address,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'leads_count' => $this->whenCounted('leads'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
