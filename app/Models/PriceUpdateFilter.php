<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceUpdateFilter extends Model
{
    use HasFactory;

    protected $fillable = [
        'price_update_id',
        'entity_level',
        'attribute_id',
        'attribute_option_id',
    ];

    protected $casts = [
        'price_update_id' => 'integer',
        'attribute_id' => 'integer',
        'attribute_option_id' => 'integer',
    ];

    public function priceUpdate(): BelongsTo
    {
        return $this->belongsTo(PriceUpdate::class);
    }

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    public function attributeOption(): BelongsTo
    {
        return $this->belongsTo(AttributeOption::class);
    }
}
