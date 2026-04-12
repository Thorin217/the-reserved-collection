<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttributeResource extends JsonResource
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
            'code' => $this->code,
            'name' => $this->name,
            'entity_level' => $this->entity_level,
            'entity_levels' => $this->whenLoaded('entityLevels', fn () => $this->entityLevels->pluck('entity_level')->map(fn ($level) => is_string($level) ? $level : $level?->value)->values()),
            'data_type' => $this->data_type,
            'unit' => $this->unit,
            'is_filterable' => $this->is_filterable,
            'is_required' => $this->is_required,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            'attribute_options' => AttributeOptionResource::collection($this->whenLoaded('attributeOptions')),
            'product_attribute_values' => ProductAttributeValueResource::collection($this->whenLoaded('productAttributeValues')),
        ];
    }
}
