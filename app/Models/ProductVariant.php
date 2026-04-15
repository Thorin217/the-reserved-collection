<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ProductVariant extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'attribute_summary',
        'cost',
        'price',
        'compare_price',
        'weight',
        'is_active',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'cost' => 'decimal:8',
        'price' => 'decimal:8',
        'compare_price' => 'decimal:8',
        'weight' => 'decimal:3',
        'is_active' => 'boolean',
    ];

    // Relacion "Product"
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Relacion "ProductSerials"
    public function serials(): HasMany
    {
        return $this->hasMany(ProductSerial::class);
    }

    // Relacion "InventoryAdjustmentItems"
    public function inventoryAdjustmentItems(): HasMany
    {
        return $this->hasMany(InventoryAdjustmentItem::class);
    }

    // Relacion "InventoryMovements"
    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    // Relacion "InventoryReservations"
    public function inventoryReservations(): HasMany
    {
        return $this->hasMany(InventoryReservation::class);
    }

    // Relacion "InventoryStocks"
    public function inventoryStocks(): HasMany
    {
        return $this->hasMany(InventoryStock::class);
    }

    // Relacion "InventoryTransferItems"
    public function inventoryTransferItems(): HasMany
    {
        return $this->hasMany(InventoryTransferItem::class);
    }

    // Relacion "ProductAttributeValues"
    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }

    public function quoteItems(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('product-variant');
    }
}
