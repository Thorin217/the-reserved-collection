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
            'quotes_count' => $this->whenCounted('quotes'),
            'sales_count' => $this->whenCounted('sales'),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
            'leads' => $this->whenLoaded('leads', fn () => $this->leads->map(fn ($lead) => [
                'id' => $lead->id,
                'title' => $lead->title,
                'status' => $lead->status,
                'source' => $lead->source,
                'created_at' => $lead->created_at,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
