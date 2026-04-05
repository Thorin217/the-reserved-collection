<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttributeOption extends Model
{
    use HasFactory;

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
}
