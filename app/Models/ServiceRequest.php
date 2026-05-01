<?php

namespace App\Models;

use App\Enums\ServiceRequestStatus;
use App\Enums\ServiceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceRequest extends Model
{
    protected $fillable = [
        'user_id',
        'client_id',
        'sale_id',
        'sale_item_id',
        'service_type',
        'status',
        'scheduled_at',
        'notes',
        'internal_notes',
        'completed_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'client_id' => 'integer',
        'sale_id' => 'integer',
        'sale_item_id' => 'integer',
        'service_type' => ServiceType::class,
        'status' => ServiceRequestStatus::class,
        'scheduled_at' => 'date',
        'completed_at' => 'datetime',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(ServiceRequestMessage::class)->orderBy('created_at');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }
}
