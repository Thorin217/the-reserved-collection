<?php

namespace App\Models;

use Database\Factories\AuctionItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuctionItem extends Model
{
    /** @use HasFactory<AuctionItemFactory> */
    use HasFactory;

    protected $fillable = [
        'auction_id',
        'position',
        'product_id',
        'product_variant_id',
        'product_serial_id',
        'inventory_source_type',
        'reference_price',
        'snapshot',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'auction_id' => 'integer',
            'position' => 'integer',
            'product_id' => 'integer',
            'product_variant_id' => 'integer',
            'product_serial_id' => 'integer',
            'reference_price' => 'decimal:2',
            'snapshot' => 'array',
        ];
    }

    public function auction(): BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function productSerial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class);
    }
}
