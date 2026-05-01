<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestMessage extends Model
{
    protected $fillable = [
        'service_request_id',
        'user_id',
        'is_admin',
        'message',
    ];

    protected $casts = [
        'service_request_id' => 'integer',
        'user_id' => 'integer',
        'is_admin' => 'boolean',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
