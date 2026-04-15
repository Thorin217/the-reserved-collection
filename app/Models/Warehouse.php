<?php

namespace App\Models;

use App\Enums\WarehouseType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Warehouse extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'branch_id',
        'name',
        'type',
        'allows_sales',
        'description',
        'is_active',
    ];

    protected $casts = [
        'branch_id' => 'integer',
        'type' => WarehouseType::class,
        'allows_sales' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relacion "Branch"
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    // Relacion "InventoryAdjustments"
    public function inventoryAdjustments(): HasMany
    {
        return $this->hasMany(InventoryAdjustment::class);
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

    // Relacion "ProductSerials"
    public function productSerials(): HasMany
    {
        return $this->hasMany(ProductSerial::class);
    }

    // Relacion "InventoryTransfers" (como origen)
    public function outgoingTransfers(): HasMany
    {
        return $this->hasMany(InventoryTransfer::class, 'from_warehouse_id');
    }

    // Relacion "InventoryTransfers" (como destino)
    public function incomingTransfers(): HasMany
    {
        return $this->hasMany(InventoryTransfer::class, 'to_warehouse_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('warehouse');
    }
}
