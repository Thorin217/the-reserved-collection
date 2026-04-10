<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadProposalItem extends Model
{
    protected $fillable = [
        'lead_proposal_id',
        'product_id',
        'product_variant_id',
        'product_serial_id',
        'name',
        'model',
        'suggested_price',
        'description',
        'notes',
    ];

    protected $casts = [
        'lead_proposal_id' => 'integer',
        'product_id' => 'integer',
        'product_variant_id' => 'integer',
        'product_serial_id' => 'integer',
        'suggested_price' => 'decimal:2',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(LeadProposal::class, 'lead_proposal_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class, 'product_serial_id');
    }
}
