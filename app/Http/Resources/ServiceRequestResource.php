<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'client_id' => $this->client_id,
            'sale_id' => $this->sale_id,
            'sale_item_id' => $this->sale_item_id,
            'service_type' => $this->service_type,
            'service_type_label' => $this->service_type->label(),
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'scheduled_at' => $this->scheduled_at?->toDateString(),
            'notes' => $this->notes,
            'internal_notes' => $this->internal_notes,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,

            'user' => UserResource::make($this->whenLoaded('user')),
            'sale_item' => SaleItemResource::make($this->whenLoaded('saleItem')),
            'sale' => $this->whenLoaded('sale', fn () => [
                'id' => $this->sale->id,
                'sale_number' => $this->sale->sale_number,
                'status' => $this->sale->status->value,
                'total' => (float) $this->sale->total,
                'balance_due' => (float) $this->sale->balance_due,
            ]),
            'messages' => $this->whenLoaded('messages', fn () => $this->messages->map(fn ($msg) => [
                'id' => $msg->id,
                'message' => $msg->message,
                'is_admin' => $msg->is_admin,
                'sender_name' => $msg->user?->name ?? '—',
                'created_at' => $msg->created_at->toISOString(),
            ])->values()->all()),
        ];
    }
}
