<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAttributeValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'product_variant_id',
        'product_serial_id',
        'attribute_id',
        'value_text',
        'value_textarea',
        'value_number',
        'value_decimal',
        'value_boolean',
        'value_date',
        'attribute_option_id',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'product_variant_id' => 'integer',
        'product_serial_id' => 'integer',
        'attribute_id' => 'integer',
        'value_number' => 'integer',
        'value_decimal' => 'decimal:8',
        'value_boolean' => 'boolean',
        'value_date' => 'date',
        'attribute_option_id' => 'integer',
    ];

    // Relacion "Product"
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Relacion "ProductVariant"
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    // Relacion "ProductSerial"
    public function productSerial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class);
    }

    // Relacion "Attribute"
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    // Relacion "AttributeOption"
    public function attributeOption(): BelongsTo
    {
        return $this->belongsTo(AttributeOption::class);
    }
}
