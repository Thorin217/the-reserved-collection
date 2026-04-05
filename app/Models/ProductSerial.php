<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductSerial extends Model
{
    use HasFactory;

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
}
