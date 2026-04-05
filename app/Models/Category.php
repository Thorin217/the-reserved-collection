<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'is_active',
    ];

    protected $casts = [
        'parent_id' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relacion jerarquica "Parent"
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    // Relacion jerarquica "Children"
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    // Relacion "Products"
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
