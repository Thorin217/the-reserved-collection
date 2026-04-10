<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadProposalResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lead_id' => $this->lead_id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'notes' => $this->notes,
            'status' => $this->status,
            'sent_via' => $this->sent_via,
            'sent_at' => $this->sent_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'user' => UserResource::make($this->whenLoaded('user')),
            'items' => LeadProposalItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenCounted('items'),
        ];
    }
}
