<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Database\Factories\AccountReceivableFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountReceivable extends Model
{
    /** @use HasFactory<AccountReceivableFactory> */
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'client_id',
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
        'client_id' => 'integer',
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

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ReceivablePayment::class);
    }
}
