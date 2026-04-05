<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attribute extends Model
{
    use HasFactory;

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
}
