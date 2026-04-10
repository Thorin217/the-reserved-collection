<?php

namespace App\Http\Resources\Portal;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortalProductResource extends JsonResource
{
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
            'in_wishlist' => $this->whenAppended('in_wishlist'),
        ];
    }
}
