<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'from_warehouse_id',
        'to_warehouse_id',
        'status',
        'requested_by',
        'approved_by',
        'received_by',
        'notes',
        'sent_at',
        'received_at',
    ];

    protected $casts = [
        'from_warehouse_id' => 'integer',
        'to_warehouse_id' => 'integer',
        'requested_by' => 'integer',
        'approved_by' => 'integer',
        'received_by' => 'integer',
        'sent_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    // Relacion "FromWarehouse"
    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    // Relacion "ToWarehouse"
    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    // Relacion "Requester"
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    // Relacion "Approver"
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Relacion "Receiver"
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // Relacion "Items"
    public function items(): HasMany
    {
        return $this->hasMany(InventoryTransferItem::class);
    }
}
