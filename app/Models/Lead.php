<?php

namespace App\Models;

use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use HasFactory;

    protected $fillable = [
        'client_id',
        'assigned_to',
        'title',
        'status',
        'source',
        'product_interest',
        'expected_value',
        'notes',
        'closed_at',
    ];

    protected $casts = [
        'client_id' => 'integer',
        'assigned_to' => 'integer',
        'expected_value' => 'decimal:2',
        'closed_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(LeadInteraction::class);
    }
}
