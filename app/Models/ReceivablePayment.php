<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceivablePayment extends Model
{
    protected $fillable = [
        'account_receivable_id',
        'amount',
        'payment_method',
        'payment_date',
        'reference',
        'notes',
    ];

    protected $casts = [
        'account_receivable_id' => 'integer',
        'amount' => 'decimal:2',
        'payment_method' => PaymentMethod::class,
        'payment_date' => 'date',
    ];

    public function accountReceivable(): BelongsTo
    {
        return $this->belongsTo(AccountReceivable::class);
    }
}
