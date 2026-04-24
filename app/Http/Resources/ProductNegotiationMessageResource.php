<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductNegotiationMessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_negotiation_id' => $this->product_negotiation_id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'amount' => $this->amount,
            'message' => $this->message,
            'created_at' => $this->created_at,

            'user' => UserResource::make($this->whenLoaded('user')),
        ];
    }
}
