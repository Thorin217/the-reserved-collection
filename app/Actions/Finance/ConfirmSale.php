<?php

namespace App\Actions\Finance;

use App\Enums\InventoryMovementType;
use App\Enums\PaymentStatus;
use App\Enums\ProductSerialStatus;
use App\Enums\SalePaymentType;
use App\Enums\SaleStatus;
use App\Models\AccountReceivable;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\ProductSerial;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmSale
{
    public function handle(Sale $sale): Sale
    {
        return DB::transaction(function () use ($sale): Sale {
            $sale->loadMissing(['warehouse', 'items.productSerial', 'items.productVariant']);

            if ($sale->status === SaleStatus::Cancelled) {
                throw ValidationException::withMessages([
                    'sale' => 'Cancelled sales cannot be confirmed.',
                ]);
            }

            if ($sale->status === SaleStatus::Confirmed) {
                return $sale->fresh(['items', 'receivables']);
            }

            foreach ($sale->items as $item) {
                $this->syncInventory($sale, $item);
            }

            $soldAt = $sale->sold_at ?? now();
            $balanceDue = $sale->balance_due === null
                ? (float) $sale->total
                : (float) $sale->balance_due;

            $sale->forceFill([
                'status' => SaleStatus::Confirmed,
                'sold_at' => $soldAt,
                'balance_due' => $balanceDue,
            ])->save();

            $paidAmount = max(0, (float) $sale->total - $balanceDue);
            $paymentType = $sale->payment_type instanceof SalePaymentType
                ? $sale->payment_type
                : SalePaymentType::from((string) $sale->payment_type);

            $paymentStatus = match ($paymentType) {
                SalePaymentType::Credit => PaymentStatus::Pending,
                SalePaymentType::Cash => $balanceDue <= 0
                    ? PaymentStatus::Paid
                    : ($paidAmount > 0 ? PaymentStatus::Partial : PaymentStatus::Pending),
            };

            AccountReceivable::query()->updateOrCreate(
                ['sale_id' => $sale->id],
                [
                    'client_id' => $sale->client_id,
                    'reference' => $sale->sale_number,
                    'status' => $paymentStatus,
                    'due_date' => $soldAt->toDateString(),
                    'amount' => $sale->total,
                    'paid_amount' => $paymentType === SalePaymentType::Credit ? 0 : $paidAmount,
                    'balance_due' => $balanceDue,
                    'paid_at' => $paymentType === SalePaymentType::Cash && $balanceDue <= 0 ? $soldAt : null,
                    'notes' => 'Auto-generated from confirmed sale.',
                ],
            );

            return $sale->fresh(['items', 'receivables']);
        });
    }

    private function syncInventory(Sale $sale, SaleItem $item): void
    {
        if ($item->product_variant_id === null || $sale->warehouse_id === null) {
            return;
        }

        if ($item->product_serial_id !== null) {
            $serial = ProductSerial::query()
                ->lockForUpdate()
                ->find($item->product_serial_id);

            if (! $serial) {
                return;
            }

            $serialStatus = $serial->status instanceof ProductSerialStatus
                ? $serial->status->value
                : (string) $serial->status;

            if ($serialStatus === ProductSerialStatus::Sold->value) {
                return;
            }

            [$quantityDelta, $reservedDelta, $availableDelta] = match ($serialStatus) {
                ProductSerialStatus::Available->value, ProductSerialStatus::Returned->value => [-1.0, 0.0, -1.0],
                ProductSerialStatus::Reserved->value => [-1.0, -1.0, 0.0],
                default => [0.0, 0.0, 0.0],
            };

            $balanceAfterMovement = $this->applyStockDelta(
                $serial->warehouse_id ?? $sale->warehouse_id,
                $item->product_variant_id,
                $quantityDelta,
                $reservedDelta,
                $availableDelta,
            );

            $serial->forceFill([
                'status' => ProductSerialStatus::Sold,
            ])->save();

            InventoryMovement::create([
                'movement_type' => InventoryMovementType::Sale,
                'reference_type' => Sale::class,
                'reference_id' => $sale->id,
                'branch_id' => $sale->warehouse?->branch_id,
                'warehouse_id' => $serial->warehouse_id ?? $sale->warehouse_id,
                'product_variant_id' => $item->product_variant_id,
                'serial_id' => $serial->id,
                'quantity' => -1,
                'unit_cost' => $item->unit_price,
                'balance_after_movement' => $balanceAfterMovement,
                'notes' => 'Sale confirmed: '.$sale->sale_number,
                'user_id' => $sale->user_id,
            ]);

            return;
        }

        $quantity = max(0, (float) $item->quantity);

        $balanceAfterMovement = $this->applyStockDelta(
            $sale->warehouse_id,
            $item->product_variant_id,
            -$quantity,
            0,
            -$quantity,
        );

        InventoryMovement::create([
            'movement_type' => InventoryMovementType::Sale,
            'reference_type' => Sale::class,
            'reference_id' => $sale->id,
            'branch_id' => $sale->warehouse?->branch_id,
            'warehouse_id' => $sale->warehouse_id,
            'product_variant_id' => $item->product_variant_id,
            'quantity' => -$quantity,
            'unit_cost' => $item->unit_price,
            'balance_after_movement' => $balanceAfterMovement,
            'notes' => 'Sale confirmed: '.$sale->sale_number,
            'user_id' => $sale->user_id,
        ]);
    }

    private function applyStockDelta(
        int $warehouseId,
        int $productVariantId,
        float $quantityDelta,
        float $reservedDelta,
        float $availableDelta,
    ): float {
        $stock = InventoryStock::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_variant_id', $productVariantId)
            ->lockForUpdate()
            ->first();

        if (! $stock) {
            return 0;
        }

        $stock->quantity = max(0, (float) $stock->quantity + $quantityDelta);
        $stock->reserved_quantity = max(0, (float) $stock->reserved_quantity + $reservedDelta);
        $stock->available_quantity = max(0, (float) $stock->available_quantity + $availableDelta);
        $stock->save();

        return (float) $stock->quantity;
    }
}
