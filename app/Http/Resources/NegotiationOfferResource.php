<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NegotiationOfferResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'negotiation_id' => $this->negotiation_id,
            'type' => $this->type,
            'amount' => $this->amount,
            'notes' => $this->notes,
            'created_at' => $this->created_at,

            'user' => UserResource::make($this->whenLoaded('user')),
        ];
    }
}
