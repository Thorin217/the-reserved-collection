<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status,
            'source' => $this->source,
            'product_interest' => $this->product_interest,
            'expected_value' => $this->expected_value,
            'notes' => $this->notes,
            'closed_at' => $this->closed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'client' => ClientResource::make($this->whenLoaded('client')),
            'assigned_user' => UserResource::make($this->whenLoaded('assignedUser')),
            'interactions' => LeadInteractionResource::collection($this->whenLoaded('interactions')),
            'interactions_count' => $this->whenCounted('interactions'),
        ];
    }
}
