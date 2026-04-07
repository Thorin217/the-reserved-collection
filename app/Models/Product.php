<?php

namespace App\Models;

use App\Enums\ProductStatus;
use App\Enums\ProductType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'sku',
        'slug',
        'description',
        'product_type',
        'track_stock',
        'has_serial_numbers',
        'status',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'brand_id' => 'integer',
        'product_type' => ProductType::class,
        'track_stock' => 'boolean',
        'has_serial_numbers' => 'boolean',
        'status' => ProductStatus::class,
    ];

    // Relaciones
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // Relacion "Brand"
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    // Relacion "Variants"
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    // Relacion "AttributeValues"
    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('product');
    }
}
