<?php

namespace App\Actions\Finance;

use App\Enums\PurchaseStatus;
use App\Models\Purchase;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SavePurchase
{
    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(array $validated, User $user, ?Purchase $purchase = null): Purchase
    {
        return DB::transaction(function () use ($validated, $user, $purchase): Purchase {
            $purchase ??= new Purchase([
                'purchase_number' => $this->temporaryPurchaseNumber(),
            ]);

            $subtotal = collect($validated['items'])
                ->sum(fn (array $item): float => (float) $item['quantity'] * (float) $item['unit_cost']);

            $taxTotal = (float) ($validated['tax_total'] ?? 0);
            $discountTotal = (float) ($validated['discount_total'] ?? 0);
            $total = max(0, $subtotal + $taxTotal - $discountTotal);
            $balanceDue = (float) ($validated['balance_due'] ?? $total);

            $vendorName = isset($validated['vendor_id'])
                ? (Vendor::find($validated['vendor_id'])?->name ?? $validated['vendor_name'] ?? null)
                : ($validated['vendor_name'] ?? null);

            $purchase->fill([
                'vendor_id' => $validated['vendor_id'] ?? null,
                'vendor_name' => $vendorName,
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'user_id' => $purchase->exists ? $purchase->user_id : $user->id,
                'reference' => $validated['reference'] ?? null,
                'status' => PurchaseStatus::Draft,
                'currency' => 'USD',
                'purchased_at' => $validated['purchased_at'] ?? null,
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'total' => $total,
                'balance_due' => max(0, min($total, $balanceDue)),
                'notes' => $validated['notes'] ?? null,
            ]);

            $purchase->save();

            if (str_starts_with((string) $purchase->purchase_number, 'PO-TMP-')) {
                $purchase->forceFill([
                    'purchase_number' => $this->finalPurchaseNumber($purchase),
                ])->save();
            }

            $purchase->items()->delete();

            foreach ($validated['items'] as $item) {
                $quantity = (float) $item['quantity'];
                $unitCost = (float) $item['unit_cost'];

                $purchase->items()->create([
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'line_total' => $quantity * $unitCost,
                ]);
            }

            return $purchase->fresh([
                'vendor',
                'warehouse',
                'user',
                'items.productVariant.product.brand',
            ]);
        });
    }

    private function temporaryPurchaseNumber(): string
    {
        return 'PO-TMP-'.Str::upper(Str::random(12));
    }

    private function finalPurchaseNumber(Purchase $purchase): string
    {
        return 'PO-'.str_pad((string) $purchase->id, 6, '0', STR_PAD_LEFT);
    }
}
