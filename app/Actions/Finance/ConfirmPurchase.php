<?php

namespace App\Actions\Finance;

use App\Enums\InventoryMovementType;
use App\Enums\PaymentStatus;
use App\Enums\PurchaseStatus;
use App\Models\AccountPayable;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmPurchase
{
    public function handle(Purchase $purchase): Purchase
    {
        return DB::transaction(function () use ($purchase): Purchase {
            $purchase->loadMissing(['warehouse', 'items.productVariant', 'vendor']);

            if ($purchase->status === PurchaseStatus::Cancelled) {
                throw ValidationException::withMessages([
                    'purchase' => 'Cancelled purchases cannot be confirmed.',
                ]);
            }

            if ($purchase->status === PurchaseStatus::Confirmed) {
                return $purchase->fresh(['items', 'payable']);
            }

            foreach ($purchase->items as $item) {
                $this->receiveItem($purchase, $item);
            }

            $purchasedAt = $purchase->purchased_at ?? now();
            $balanceDue = $purchase->balance_due === null
                ? (float) $purchase->total
                : (float) $purchase->balance_due;

            $purchase->forceFill([
                'status' => PurchaseStatus::Confirmed,
                'purchased_at' => $purchasedAt,
                'balance_due' => $balanceDue,
            ])->save();

            $paidAmount = max(0, (float) $purchase->total - $balanceDue);
            $paymentStatus = $balanceDue <= 0
                ? PaymentStatus::Paid
                : ($paidAmount > 0 ? PaymentStatus::Partial : PaymentStatus::Pending);

            AccountPayable::query()->updateOrCreate(
                ['purchase_id' => $purchase->id],
                [
                    'vendor_id' => $purchase->vendor_id,
                    'vendor_name' => $purchase->resolvedVendorName(),
                    'reference' => $purchase->purchase_number,
                    'status' => $paymentStatus,
                    'due_date' => $purchasedAt->toDateString(),
                    'amount' => $purchase->total,
                    'paid_amount' => $paidAmount,
                    'balance_due' => $balanceDue,
                    'paid_at' => $balanceDue <= 0 ? $purchasedAt : null,
                    'notes' => 'Auto-generated from confirmed purchase.',
                ],
            );

            return $purchase->fresh(['items', 'payable']);
        });
    }

    private function receiveItem(Purchase $purchase, PurchaseItem $item): void
    {
        if ($item->product_variant_id === null || $purchase->warehouse_id === null) {
            return;
        }

        $quantity = max(0, (float) $item->quantity);

        $stock = InventoryStock::query()
            ->where('warehouse_id', $purchase->warehouse_id)
            ->where('product_variant_id', $item->product_variant_id)
            ->lockForUpdate()
            ->first();

        if ($stock) {
            $stock->quantity = (float) $stock->quantity + $quantity;
            $stock->available_quantity = (float) $stock->available_quantity + $quantity;
            $stock->save();
            $balanceAfter = (float) $stock->quantity;
        } else {
            InventoryStock::create([
                'warehouse_id' => $purchase->warehouse_id,
                'product_variant_id' => $item->product_variant_id,
                'quantity' => $quantity,
                'reserved_quantity' => 0,
                'available_quantity' => $quantity,
            ]);
            $balanceAfter = $quantity;
        }

        InventoryMovement::create([
            'movement_type' => InventoryMovementType::Purchase,
            'reference_type' => Purchase::class,
            'reference_id' => $purchase->id,
            'branch_id' => $purchase->warehouse?->branch_id,
            'warehouse_id' => $purchase->warehouse_id,
            'product_variant_id' => $item->product_variant_id,
            'quantity' => $quantity,
            'unit_cost' => $item->unit_cost,
            'balance_after_movement' => $balanceAfter,
            'notes' => 'Purchase received: '.$purchase->purchase_number,
            'user_id' => $purchase->user_id,
        ]);
    }
}
