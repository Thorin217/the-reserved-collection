<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class InventoryStock extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'warehouse_id',
        'product_variant_id',
        'quantity',
        'reserved_quantity',
        'available_quantity',
        'average_cost',
    ];

    protected $casts = [
        'warehouse_id' => 'integer',
        'product_variant_id' => 'integer',
        'quantity' => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
        'available_quantity' => 'decimal:2',
        'average_cost' => 'decimal:2',
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

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('inventory-stock');
    }
}
