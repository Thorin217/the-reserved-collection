<?php

namespace App\Actions\Finance;

use App\Enums\SaleStatus;
use App\Models\Quote;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CreateSaleFromQuote
{
    public function __construct(private readonly SaveSale $saveSale) {}

    public function handle(Quote $quote, User $user): Sale
    {
        $existingSale = $quote->sales()->latest('id')->first();

        if ($existingSale instanceof Sale) {
            return $existingSale;
        }

        $quote->loadMissing(['items.productVariant.product']);

        if ($quote->items->isEmpty()) {
            throw ValidationException::withMessages([
                'quote' => 'The quote must have at least one item before converting to sale.',
            ]);
        }

        if ($quote->items->contains(fn ($item): bool => $item->product_variant_id === null)) {
            throw ValidationException::withMessages([
                'quote' => 'All quote items must have a product variant before converting to sale.',
            ]);
        }

        $payload = [
            'client_id' => $quote->client_id,
            'lead_id' => $quote->lead_id,
            'quote_id' => $quote->id,
            'negotiation_id' => $quote->negotiation_id,
            'warehouse_id' => null,
            'status' => SaleStatus::Draft->value,
            'sold_at' => null,
            'tax_total' => (float) $quote->tax_total,
            'discount_total' => (float) $quote->discount_total,
            'balance_due' => (float) $quote->total,
            'notes' => $quote->notes,
            'items' => $quote->items
                ->map(fn ($item): array => [
                    'product_variant_id' => $item->product_variant_id,
                    'product_serial_id' => $item->product_serial_id,
                    'description' => $item->description,
                    'quantity' => (float) $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                ])
                ->values()
                ->all(),
        ];

        return $this->saveSale->handle($payload, $user);
    }
}
