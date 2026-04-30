<?php

namespace App\Http\Resources;

use App\Enums\AuctionEventFormat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuctionEventResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'format' => $this->format instanceof AuctionEventFormat ? $this->format->value : $this->format,
            'status' => $this->status,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'hero_image_url' => $this->hero_image_url,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'closed_by' => $this->closed_by,
            'closed_at' => $this->closed_at,
            'auctions_count' => $this->whenCounted('auctions'),
            'creator' => UserResource::make($this->whenLoaded('creator')),
            'closer' => UserResource::make($this->whenLoaded('closer')),
            'auctions' => AuctionResource::collection($this->whenLoaded('auctions')),
        ];
    }
}
