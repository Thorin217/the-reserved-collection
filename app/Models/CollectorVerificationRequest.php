<?php

namespace App\Models;

use App\Enums\CollectorVerificationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectorVerificationRequest extends Model
{
    protected $fillable = [
        'user_id',
        'status',
        'message',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'status' => CollectorVerificationStatus::class,
        'reviewed_by' => 'integer',
        'reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
