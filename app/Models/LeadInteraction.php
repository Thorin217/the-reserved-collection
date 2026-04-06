<?php

namespace App\Models;

use Database\Factories\LeadInteractionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadInteraction extends Model
{
    /** @use HasFactory<LeadInteractionFactory> */
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'user_id',
        'type',
        'notes',
        'interacted_at',
    ];

    protected $casts = [
        'lead_id' => 'integer',
        'user_id' => 'integer',
        'interacted_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
