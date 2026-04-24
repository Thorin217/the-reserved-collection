<?php

namespace App\Models;

use App\Enums\ProductNegotiationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductNegotiation extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'product_variant_id',
        'status',
        'initial_offer',
        'final_price',
        'notes',
        'agreed_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'product_id' => 'integer',
        'product_variant_id' => 'integer',
        'status' => ProductNegotiationStatus::class,
        'initial_offer' => 'decimal:2',
        'final_price' => 'decimal:2',
        'agreed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ProductNegotiationMessage::class);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [ProductNegotiationStatus::Pending, ProductNegotiationStatus::Active]);
    }
}
