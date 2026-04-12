<?php

namespace App\Models;

use App\Enums\AttributeEntityLevel as AttributeEntityLevelEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttributeEntityLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'attribute_id',
        'entity_level',
    ];

    protected $casts = [
        'entity_level' => AttributeEntityLevelEnum::class,
    ];

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }
}
