<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NegotiationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lead_id' => $this->lead_id,
            'lead_proposal_id' => $this->lead_proposal_id,
            'user_id' => $this->user_id,
            'status' => $this->status,
            'initial_price' => $this->initial_price,
            'final_price' => $this->final_price,
            'notes' => $this->notes,
            'agreed_at' => $this->agreed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'user' => UserResource::make($this->whenLoaded('user')),
            'lead' => LeadResource::make($this->whenLoaded('lead')),
            'proposal' => LeadProposalResource::make($this->whenLoaded('proposal')),
            'offers' => NegotiationOfferResource::collection($this->whenLoaded('offers')),
            'offers_count' => $this->whenCounted('offers'),
        ];
    }
}
