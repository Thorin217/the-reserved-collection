<?php

namespace App\Actions\Finance;

use App\Enums\SaleStatus;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaveSale
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(array $validated, User $user, ?Sale $sale = null): Sale
    {
        return DB::transaction(function () use ($validated, $user, $sale): Sale {
            $sale ??= new Sale([
                'sale_number' => $this->temporarySaleNumber(),
            ]);

            $subtotal = collect($validated['items'])
                ->sum(fn (array $item): float => (float) $item['quantity'] * (float) $item['unit_price']);

            $taxTotal = (float) ($validated['tax_total'] ?? 0);
            $discountTotal = (float) ($validated['discount_total'] ?? 0);
            $total = max(0, $subtotal + $taxTotal - $discountTotal);
            $balanceDue = (float) ($validated['balance_due'] ?? $total);

            $sale->fill([
                'client_id' => $validated['client_id'],
                'lead_id' => $validated['lead_id'] ?? null,
                'quote_id' => $validated['quote_id'] ?? null,
                'negotiation_id' => $validated['negotiation_id'] ?? null,
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'user_id' => $sale->exists ? $sale->user_id : $user->id,
                'status' => $validated['status'] ?? SaleStatus::Draft,
                'currency' => 'USD',
                'sold_at' => $validated['sold_at'] ?? null,
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'total' => $total,
                'balance_due' => max(0, min($total, $balanceDue)),
                'notes' => $validated['notes'] ?? null,
            ]);

            $sale->save();

            if (str_starts_with((string) $sale->sale_number, 'SALE-TMP-')) {
                $sale->forceFill([
                    'sale_number' => $this->finalSaleNumber($sale),
                ])->save();
            }

            $sale->items()->delete();

            foreach ($validated['items'] as $item) {
                $quantity = (float) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];

                $sale->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'product_serial_id' => $item['product_serial_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $quantity * $unitPrice,
                ]);
            }

            return $sale->fresh([
                'client',
                'lead.client',
                'quote',
                'negotiation',
                'warehouse',
                'user',
                'items.productVariant.product.brand',
                'items.productSerial',
                'receivables',
            ]);
        });
    }

    private function temporarySaleNumber(): string
    {
        return 'SALE-TMP-'.Str::upper(Str::random(12));
    }

    private function finalSaleNumber(Sale $sale): string
    {
        return 'SALE-'.str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT);
    }
}
