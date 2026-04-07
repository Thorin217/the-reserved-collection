<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class AttributeOption extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'attribute_id',
        'value',
        'label',
        'sort_order',
    ];

    protected $casts = [
        'attribute_id' => 'integer',
        'sort_order' => 'integer',
    ];

    // Relacion "Attribute"
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    // Relacion "ProductAttributeValues"
    public function productAttributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('attribute-option');
    }
}
