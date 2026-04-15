<?php

namespace App\Models;

use App\Enums\NegotiationStatus;
use Database\Factories\NegotiationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Negotiation extends Model
{
    /** @use HasFactory<NegotiationFactory> */
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'lead_proposal_id',
        'user_id',
        'status',
        'initial_price',
        'final_price',
        'notes',
        'agreed_at',
    ];

    protected $casts = [
        'lead_id' => 'integer',
        'lead_proposal_id' => 'integer',
        'user_id' => 'integer',
        'status' => NegotiationStatus::class,
        'initial_price' => 'decimal:2',
        'final_price' => 'decimal:2',
        'agreed_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(LeadProposal::class, 'lead_proposal_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(NegotiationOffer::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function sale(): HasOne
    {
        return $this->hasOne(Sale::class);
    }
}
