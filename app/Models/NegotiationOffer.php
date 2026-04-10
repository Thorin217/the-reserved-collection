<?php

namespace App\Models;

use App\Enums\NegotiationOfferType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NegotiationOffer extends Model
{
    protected $fillable = [
        'negotiation_id',
        'user_id',
        'type',
        'amount',
        'notes',
    ];

    protected $casts = [
        'negotiation_id' => 'integer',
        'user_id' => 'integer',
        'type' => NegotiationOfferType::class,
        'amount' => 'decimal:2',
    ];

    public function negotiation(): BelongsTo
    {
        return $this->belongsTo(Negotiation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
