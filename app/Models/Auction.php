<?php

namespace App\Models;

use App\Enums\AuctionClosureResult;
use App\Enums\AuctionStatus;
use Database\Factories\AuctionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Auction extends Model
{
    /** @use HasFactory<AuctionFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'status',
        'closure_result',
        'inventory_source_type',
        'lot_number',
        'hero_image_url',
        'starting_price',
        'reserve_price',
        'minimum_increment',
        'current_bid_amount',
        'current_bid_user_id',
        'winning_bid_id',
        'winner_user_id',
        'hammer_price',
        'total_due',
        'starts_at',
        'ends_at',
        'closed_at',
        'is_manually_closed',
        'created_by',
        'closed_by',
        'inventory_snapshot',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => AuctionStatus::class,
            'closure_result' => AuctionClosureResult::class,
            'current_bid_user_id' => 'integer',
            'winning_bid_id' => 'integer',
            'winner_user_id' => 'integer',
            'created_by' => 'integer',
            'closed_by' => 'integer',
            'starting_price' => 'decimal:2',
            'reserve_price' => 'decimal:2',
            'minimum_increment' => 'decimal:2',
            'current_bid_amount' => 'decimal:2',
            'hammer_price' => 'decimal:2',
            'total_due' => 'decimal:2',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'closed_at' => 'datetime',
            'is_manually_closed' => 'boolean',
            'inventory_snapshot' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function currentBidUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_bid_user_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }

    public function winningBid(): BelongsTo
    {
        return $this->belongsTo(AuctionBid::class, 'winning_bid_id');
    }

    public function bids(): HasMany
    {
        return $this->hasMany(AuctionBid::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(AuctionItem::class)->orderBy('position');
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->whereIn('status', [
            AuctionStatus::Scheduled->value,
            AuctionStatus::Live->value,
            AuctionStatus::Closed->value,
        ]);
    }

    public function canAcceptBids(): bool
    {
        return $this->status === AuctionStatus::Live
            && $this->closed_at === null
            && $this->ends_at !== null
            && $this->ends_at->isFuture();
    }

    public function minimumAllowedBid(): float
    {
        $currentBid = (float) ($this->current_bid_amount ?? 0);

        if ($currentBid <= 0) {
            return (float) $this->starting_price;
        }

        return $currentBid + (float) $this->minimum_increment;
    }
}
