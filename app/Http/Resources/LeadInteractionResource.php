<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadInteractionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lead_id' => $this->lead_id,
            'type' => $this->type,
            'notes' => $this->notes,
            'interacted_at' => $this->interacted_at,
            'created_at' => $this->created_at,

            'user' => UserResource::make($this->whenLoaded('user')),
        ];
    }
}
