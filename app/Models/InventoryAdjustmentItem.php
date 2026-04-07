<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class InventoryAdjustmentItem extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'adjustment_id',
        'product_variant_id',
        'quantity',
        'unit_cost',
    ];

    protected $casts = [
        'adjustment_id' => 'integer',
        'product_variant_id' => 'integer',
        'quantity' => 'decimal:3',
        'unit_cost' => 'decimal:8',
    ];

    // Relacion "InventoryAdjustment"
    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(InventoryAdjustment::class, 'adjustment_id');
    }

    // Relacion "ProductVariant"
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('inventory-adjustment-item');
    }
}
