<?php

namespace App\Models;

use App\Enums\AttributeDataType;
use App\Enums\AttributeEntityLevel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Attribute extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'code',
        'name',
        'entity_level',
        'data_type',
        'unit',
        'is_filterable',
        'is_required',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'entity_level' => AttributeEntityLevel::class,
        'data_type' => AttributeDataType::class,
        'is_filterable' => 'boolean',
        'is_required' => 'boolean',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relacion "AttributeOptions"
    public function attributeOptions(): HasMany
    {
        return $this->hasMany(AttributeOption::class);
    }

    // Relacion "ProductAttributeValues"
    public function productAttributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('attribute');
    }
}
