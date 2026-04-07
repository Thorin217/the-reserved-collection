<?php

namespace App\Models;

use App\Enums\InventoryAdjustmentStatus;
use App\Enums\InventoryAdjustmentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class InventoryAdjustment extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'code',
        'warehouse_id',
        'adjustment_type',
        'reason',
        'status',
        'notes',
        'created_by',
        'confirmed_by',
        'confirmed_at',
    ];

    protected $casts = [
        'warehouse_id' => 'integer',
        'adjustment_type' => InventoryAdjustmentType::class,
        'status' => InventoryAdjustmentStatus::class,
        'created_by' => 'integer',
        'confirmed_by' => 'integer',
        'confirmed_at' => 'datetime',
    ];

    // Relacion "Warehouse"
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    // Relacion "Creator"
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relacion "Confirmer"
    public function confirmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    // Relacion "Items"
    public function items(): HasMany
    {
        return $this->hasMany(InventoryAdjustmentItem::class, 'adjustment_id');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('inventory-adjustment');
    }
}
