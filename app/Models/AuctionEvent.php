<?php

namespace App\Models;

use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use Database\Factories\AuctionEventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuctionEvent extends Model
{
    /** @use HasFactory<AuctionEventFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'format',
        'status',
        'starts_at',
        'ends_at',
        'hero_image_url',
        'notes',
        'created_by',
        'closed_by',
        'closed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'format' => AuctionEventFormat::class,
            'status' => AuctionStatus::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'closed_at' => 'datetime',
            'created_by' => 'integer',
            'closed_by' => 'integer',
        ];
    }

    public function auctions(): HasMany
    {
        return $this->hasMany(Auction::class)->orderBy('sequence');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }
}
