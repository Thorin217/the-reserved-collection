<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Database\Factories\AccountPayableFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountPayable extends Model
{
    /** @use HasFactory<AccountPayableFactory> */
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'user_id',
        'vendor_id',
        'vendor_name',
        'reference',
        'status',
        'due_date',
        'amount',
        'paid_amount',
        'balance_due',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'sale_id' => 'integer',
        'user_id' => 'integer',
        'vendor_id' => 'integer',
        'status' => PaymentStatus::class,
        'due_date' => 'date',
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PayablePayment::class);
    }

    public function resolvedVendorName(): string
    {
        return $this->vendor?->name ?? $this->vendor_name ?? '—';
    }
}
