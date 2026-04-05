<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'movement_type',
        'reference_type',
        'reference_id',
        'branch_id',
        'warehouse_id',
        'product_variant_id',
        'serial_id',
        'quantity',
        'unit_cost',
        'balance_after_movement',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'reference_id' => 'integer',
        'branch_id' => 'integer',
        'warehouse_id' => 'integer',
        'product_variant_id' => 'integer',
        'serial_id' => 'integer',
        'quantity' => 'decimal:8',
        'unit_cost' => 'decimal:8',
        'balance_after_movement' => 'decimal:8',
        'user_id' => 'integer',
    ];

    // Relacion "Reference"
    public function reference(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }

    // Relacion "Branch"
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

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

    // Relacion "ProductSerial"
    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class, 'serial_id');
    }

    // Relacion "User"
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
