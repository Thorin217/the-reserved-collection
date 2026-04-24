<?php

namespace App\Models;

use Database\Factories\AuctionBidFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuctionBid extends Model
{
    /** @use HasFactory<AuctionBidFactory> */
    use HasFactory;

    protected $fillable = [
        'auction_id',
        'user_id',
        'amount',
        'placed_at',
        'is_winning',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'auction_id' => 'integer',
            'user_id' => 'integer',
            'amount' => 'decimal:2',
            'placed_at' => 'datetime',
            'is_winning' => 'boolean',
        ];
    }

    public function auction(): BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
