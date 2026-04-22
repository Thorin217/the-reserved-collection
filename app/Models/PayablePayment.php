<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayablePayment extends Model
{
    protected $fillable = [
        'account_payable_id',
        'amount',
        'payment_method',
        'payment_date',
        'reference',
        'notes',
    ];

    protected $casts = [
        'account_payable_id' => 'integer',
        'amount' => 'decimal:2',
        'payment_method' => PaymentMethod::class,
        'payment_date' => 'date',
    ];

    public function accountPayable(): BelongsTo
    {
        return $this->belongsTo(AccountPayable::class);
    }
}
