<?php

namespace App\Actions\Finance;

use App\Enums\QuoteStatus;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaveQuote
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(array $validated, User $user, ?Quote $quote = null): Quote
    {
        return DB::transaction(function () use ($validated, $user, $quote): Quote {
            $quote ??= new Quote([
                'quote_number' => $this->temporaryQuoteNumber(),
            ]);

            $subtotal = collect($validated['items'])
                ->sum(fn (array $item): float => (float) $item['quantity'] * (float) $item['unit_price']);

            $taxTotal = (float) ($validated['tax_total'] ?? 0);
            $discountTotal = (float) ($validated['discount_total'] ?? 0);
            $total = max(0, $subtotal + $taxTotal - $discountTotal);
            $status = QuoteStatus::from((string) $validated['status']);

            $quote->fill([
                'client_id' => $validated['client_id'],
                'lead_id' => $validated['lead_id'] ?? null,
                'negotiation_id' => null,
                'user_id' => $quote->exists ? $quote->user_id : $user->id,
                'status' => $status,
                'currency' => $validated['currency'] ?? 'USD',
                'issued_at' => $validated['issued_at'] ?? null,
                'expires_at' => $validated['expires_at'] ?? null,
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
                'approved_at' => $status === QuoteStatus::Approved
                    ? ($quote->approved_at ?? now())
                    : null,
            ]);

            $quote->save();

            if (str_starts_with((string) $quote->quote_number, 'Q-TMP-')) {
                $quote->forceFill([
                    'quote_number' => $this->finalQuoteNumber($quote),
                ])->save();
            }

            $quote->items()->delete();

            foreach ($validated['items'] as $item) {
                $quote->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'product_serial_id' => $item['product_serial_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => (float) $item['quantity'] * (float) $item['unit_price'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $quote->fresh([
                'client',
                'lead.client',
                'user',
                'items.productVariant.product',
                'items.productSerial',
            ]);
        });
    }

    private function temporaryQuoteNumber(): string
    {
        return 'Q-TMP-'.Str::upper(Str::random(12));
    }

    private function finalQuoteNumber(Quote $quote): string
    {
        return 'Q-'.str_pad((string) $quote->id, 6, '0', STR_PAD_LEFT);
    }
}
