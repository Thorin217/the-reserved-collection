<?php

namespace App\Models;

use App\Enums\ProposalStatus;
use Database\Factories\LeadProposalFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadProposal extends Model
{
    /** @use HasFactory<LeadProposalFactory> */
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'user_id',
        'title',
        'notes',
        'status',
        'sent_via',
        'sent_at',
    ];

    protected $casts = [
        'lead_id' => 'integer',
        'user_id' => 'integer',
        'status' => ProposalStatus::class,
        'sent_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(LeadProposalItem::class);
    }

    public function negotiation(): HasMany
    {
        return $this->hasMany(Negotiation::class);
    }
}
