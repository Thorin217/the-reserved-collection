<?php

namespace App\Http\Resources\Portal;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortalProductResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        /** @var Product $this */
        $firstVariant = $this->resource->relationLoaded('variants')
            ? $this->resource->variants->first()
            : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'description' => $this->description,
            'product_type' => $this->product_type,
            'has_serial_numbers' => $this->has_serial_numbers,
            'brand' => $this->whenLoaded('brand', fn () => [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ]),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'price' => $firstVariant?->price,
            'compare_price' => $firstVariant?->compare_price,
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(fn ($v) => [
                'id' => $v->id,
                'sku' => $v->sku,
                'price' => $v->price,
                'compare_price' => $v->compare_price,
                'attribute_summary' => $v->attribute_summary,
                'is_active' => $v->is_active,
            ])
            ),
            'image_url' => $this->getFirstMediaUrl('product'),
            'attribute_values' => $this->whenLoaded('attributeValues', fn () => $this->attributeValues
                ->filter(fn ($v) => $v->attribute !== null)
                ->map(fn ($v) => [
                    'label' => $v->attribute->name,
                    'value' => $v->value_text
                        ?? $v->value_textarea
                        ?? ($v->value_number !== null ? (string) $v->value_number : null)
                        ?? ($v->value_decimal !== null ? number_format((float) $v->value_decimal, 2) : null)
                        ?? ($v->value_boolean !== null ? ($v->value_boolean ? 'Yes' : 'No') : null)
                        ?? ($v->value_date !== null ? $v->value_date->format('Y') : null),
                    'sort_order' => $v->attribute->sort_order,
                ])
                ->filter(fn ($item) => $item['value'] !== null)
                ->sortBy('sort_order')
                ->values(),
            ),
            'price_history' => $this->whenLoaded('priceHistories', fn () => $this->priceHistories->map(fn ($history) => [
                'price' => $history->price,
                'recorded_at' => $history->recorded_at?->toDateString(),
            ])),
            'in_wishlist' => $this->whenAppended('in_wishlist'),
        ];
    }
}
