<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuctionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $userHasBid = $user !== null ? (bool) ($this->user_has_bid ?? false) : false;
        $participationResult = null;

        if ($userHasBid) {
            if ($this->status?->value === 'closed') {
                if ($this->closure_result?->value === 'reserve_not_met') {
                    $participationResult = 'reserve_not_met';
                } elseif ($this->winner_user_id === $user->id) {
                    $participationResult = 'won';
                } else {
                    $participationResult = 'lost';
                }
            } elseif ($this->status?->value === 'live') {
                $participationResult = $this->current_bid_user_id === $user->id ? 'leading' : 'outbid';
            } elseif ($this->status?->value === 'scheduled') {
                $participationResult = 'scheduled';
            }
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'status' => $this->status,
            'closure_result' => $this->closure_result,
            'product_id' => $this->product_id,
            'product_variant_id' => $this->product_variant_id,
            'product_serial_id' => $this->product_serial_id,
            'inventory_source_type' => $this->inventory_source_type,
            'lot_number' => $this->lot_number,
            'starting_price' => $this->starting_price,
            'reserve_price' => $this->reserve_price,
            'minimum_increment' => $this->minimum_increment,
            'current_bid_amount' => $this->current_bid_amount,
            'current_bid_user_id' => $this->current_bid_user_id,
            'winning_bid_id' => $this->winning_bid_id,
            'winner_user_id' => $this->winner_user_id,
            'hammer_price' => $this->hammer_price,
            'total_due' => $this->total_due,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'closed_at' => $this->closed_at,
            'is_manually_closed' => $this->is_manually_closed,
            'created_by' => $this->created_by,
            'closed_by' => $this->closed_by,
            'inventory_snapshot' => $this->inventory_snapshot,
            'notes' => $this->notes,
            'minimum_allowed_bid' => $this->minimumAllowedBid(),
            'bids_count' => $this->whenCounted('bids'),
            'user_has_bid' => $userHasBid,
            'user_bid_count' => $this->when(isset($this->user_bid_count), fn () => (int) $this->user_bid_count),
            'user_max_bid_amount' => $this->when(isset($this->user_max_bid_amount), fn () => $this->user_max_bid_amount),
            'participation_result' => $participationResult,
            'creator' => UserResource::make($this->whenLoaded('creator')),
            'closer' => UserResource::make($this->whenLoaded('closer')),
            'current_bid_user' => UserResource::make($this->whenLoaded('currentBidUser')),
            'winner' => UserResource::make($this->whenLoaded('winner')),
            'bids' => AuctionBidResource::collection($this->whenLoaded('bids')),
        ];
    }
}
