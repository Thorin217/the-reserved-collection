<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceUpdateItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'price_update_id',
        'product_id',
        'product_variant_id',
        'old_price',
        'new_price',
        'delta_price',
    ];

    protected $casts = [
        'price_update_id' => 'integer',
        'product_id' => 'integer',
        'product_variant_id' => 'integer',
        'old_price' => 'decimal:8',
        'new_price' => 'decimal:8',
        'delta_price' => 'decimal:8',
    ];

    public function priceUpdate(): BelongsTo
    {
        return $this->belongsTo(PriceUpdate::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
