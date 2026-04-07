<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class InventoryReservation extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'warehouse_id',
        'product_variant_id',
        'reference_type',
        'reference_id',
        'quantity',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'warehouse_id' => 'integer',
        'product_variant_id' => 'integer',
        'reference_id' => 'integer',
        'quantity' => 'decimal:3',
        'expires_at' => 'datetime',
    ];

    // Relacion "Warehouse"
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    // Relacion "ProductVariant"
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    // Relacion "Reference"
    public function reference(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('inventory-reservation');
    }
}
