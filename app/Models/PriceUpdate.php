<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriceUpdate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'notes',
        'change_type',
        'change_value',
        'affected_variants_count',
        'created_by',
    ];

    protected $casts = [
        'change_value' => 'decimal:6',
        'affected_variants_count' => 'integer',
        'created_by' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function filters(): HasMany
    {
        return $this->hasMany(PriceUpdateFilter::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PriceUpdateItem::class);
    }
}
