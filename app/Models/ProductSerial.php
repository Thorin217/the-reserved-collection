<?php

namespace App\Models;

use App\Enums\ProductSerialStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ProductSerial extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'product_variant_id',
        'serial_number',
        'imei_or_reference',
        'warehouse_id',
        'status',
    ];

    protected $casts = [
        'product_variant_id' => 'integer',
        'warehouse_id' => 'integer',
        'status' => ProductSerialStatus::class,
    ];

    // Relacion "ProductVariant"
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    // Relacion "Warehouse"
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    // Relacion "InventoryMovements"
    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'serial_id');
    }

    // Relacion "ProductAttributeValues"
    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('product-serial');
    }
}
