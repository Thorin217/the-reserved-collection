<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_transfer_id',
        'product_variant_id',
        'quantity',
        'received_quantity',
    ];

    protected $casts = [
        'inventory_transfer_id' => 'integer',
        'product_variant_id' => 'integer',
        'quantity' => 'decimal:3',
        'received_quantity' => 'decimal:3',
    ];

    // Relacion "InventoryTransfer"
    public function inventoryTransfer(): BelongsTo
    {
        return $this->belongsTo(InventoryTransfer::class);
    }

    // Relacion "ProductVariant"
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
