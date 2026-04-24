<?php

namespace App\Models;

use App\Enums\ProductNegotiationMessageType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductNegotiationMessage extends Model
{
    protected $fillable = [
        'product_negotiation_id',
        'user_id',
        'type',
        'amount',
        'message',
    ];

    protected $casts = [
        'product_negotiation_id' => 'integer',
        'user_id' => 'integer',
        'type' => ProductNegotiationMessageType::class,
        'amount' => 'decimal:2',
    ];

    public function negotiation(): BelongsTo
    {
        return $this->belongsTo(ProductNegotiation::class, 'product_negotiation_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
