<?php

namespace Database\Seeders;

use App\Enums\InventoryAdjustmentStatus;
use App\Enums\InventoryAdjustmentType;
use App\Enums\InventoryMovementType;
use App\Enums\InventoryReservationStatus;
use App\Enums\InventoryTransferStatus;
use App\Enums\ProductSerialStatus;
use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentItem;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\InventoryStock;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransferItem;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PhaseOneInventoryWorkflowSeeder extends Seeder
{
    /**
     * Seed workflow-ready records for reservations, transfers, and adjustments.
     */
    public function run(): void
    {
        DB::transaction(function (): void {
            $this->call(PhaseOneInventorySeeder::class);

            $this->seedProductImages();

            InventoryReservation::query()
                ->where('reference_type', 'seed_phase_one')
                ->update([
                    'reference_type' => null,
                    'reference_id' => null,
                ]);

            $warehouseA1 = Warehouse::query()->where('name', 'Almacén Principal San Isidro')->firstOrFail();
            $warehouseB1 = Warehouse::query()->where('name', 'Almacén Boutique Cusco')->firstOrFail();

            $simpleVariant = ProductVariant::query()->where('sku', 'RLX-SVC-001-STD')->firstOrFail();
            $serializedVariant = ProductVariant::query()->where('sku', 'RLX-SUB-126610LN-STD')->firstOrFail();

            $seedUser = User::query()->where('email', 'admin@admin.com')->first();

            $this->resetSerializedSerialsToAvailable($serializedVariant->id, $warehouseA1->id);

            $this->seedActiveSimpleReservation(
                warehouseId: $warehouseA1->id,
                branchId: $warehouseA1->branch_id,
                variantId: $simpleVariant->id,
                userId: $seedUser?->id,
            );

            $this->seedActiveSerializedReservation(
                warehouseId: $warehouseA1->id,
                branchId: $warehouseA1->branch_id,
                variantId: $serializedVariant->id,
                userId: $seedUser?->id,
            );

            $this->seedDraftTransfers(
                fromWarehouseId: $warehouseA1->id,
                toWarehouseId: $warehouseB1->id,
                simpleVariantId: $simpleVariant->id,
                serializedVariantId: $serializedVariant->id,
                userId: $seedUser?->id,
            );

            $this->seedDraftAdjustments(
                warehouseId: $warehouseA1->id,
                simpleVariantId: $simpleVariant->id,
                serializedVariantId: $serializedVariant->id,
                userId: $seedUser?->id,
            );
        });
    }

    private function resetSerializedSerialsToAvailable(int $variantId, int $warehouseId): void
    {
        ProductSerial::query()
            ->where('product_variant_id', $variantId)
            ->where('serial_number', 'like', 'RLX126610-%')
            ->update([
                'warehouse_id' => $warehouseId,
                'status' => ProductSerialStatus::Available,
            ]);
    }

    private function seedActiveSimpleReservation(int $warehouseId, int $branchId, int $variantId, ?int $userId): void
    {
        $reservation = InventoryReservation::query()->updateOrCreate(
            [
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $variantId,
                'quantity' => 2,
                'status' => InventoryReservationStatus::Active,
            ],
            [
                'reference_type' => null,
                'reference_id' => null,
                'expires_at' => now()->addDays(7),
            ],
        );

        InventoryStock::query()->updateOrCreate(
            [
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $variantId,
            ],
            [
                'quantity' => 20,
                'reserved_quantity' => 2,
                'available_quantity' => 18,
                'average_cost' => 450,
            ],
        );

        InventoryMovement::query()->updateOrCreate(
            [
                'movement_type' => InventoryMovementType::Reservation,
                'reference_type' => InventoryReservation::class,
                'reference_id' => $reservation->id,
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $variantId,
                'serial_id' => null,
            ],
            [
                'branch_id' => $branchId,
                'quantity' => 2,
                'unit_cost' => null,
                'balance_after_movement' => 20,
                'notes' => 'Reserva activa de servicio premium para validación funcional',
                'user_id' => $userId,
            ],
        );
    }

    private function seedActiveSerializedReservation(int $warehouseId, int $branchId, int $variantId, ?int $userId): void
    {
        $reservedSerials = ProductSerial::query()
            ->where('product_variant_id', $variantId)
            ->where('warehouse_id', $warehouseId)
            ->where('status', ProductSerialStatus::Available)
            ->where('serial_number', 'like', 'RLX126610-%')
            ->orderBy('serial_number')
            ->limit(2)
            ->get();

        if ($reservedSerials->count() < 2) {
            return;
        }

        ProductSerial::query()
            ->whereIn('id', $reservedSerials->pluck('id')->all())
            ->update([
                'status' => ProductSerialStatus::Reserved,
            ]);

        $reservation = InventoryReservation::query()->updateOrCreate(
            [
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $variantId,
                'quantity' => 2,
                'status' => InventoryReservationStatus::Active,
            ],
            [
                'reference_type' => null,
                'reference_id' => null,
                'expires_at' => now()->addDays(7),
            ],
        );

        InventoryStock::query()->updateOrCreate(
            [
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $variantId,
            ],
            [
                'quantity' => 5,
                'reserved_quantity' => 2,
                'available_quantity' => 3,
                'average_cost' => 9800,
            ],
        );

        foreach ($reservedSerials as $serial) {
            InventoryMovement::query()->updateOrCreate(
                [
                    'movement_type' => InventoryMovementType::Reservation,
                    'reference_type' => InventoryReservation::class,
                    'reference_id' => $reservation->id,
                    'warehouse_id' => $warehouseId,
                    'product_variant_id' => $variantId,
                    'serial_id' => $serial->id,
                ],
                [
                    'branch_id' => $branchId,
                    'quantity' => 1,
                    'unit_cost' => null,
                    'balance_after_movement' => 5,
                    'notes' => 'Reserva activa de reloj serializado · Serial '.$serial->serial_number,
                    'user_id' => $userId,
                ],
            );
        }
    }

    private function seedDraftTransfers(
        int $fromWarehouseId,
        int $toWarehouseId,
        int $simpleVariantId,
        int $serializedVariantId,
        ?int $userId,
    ): void {
        $simpleTransfer = InventoryTransfer::query()->updateOrCreate(
            ['code' => 'TRF-SI-CUS-0001'],
            [
                'from_warehouse_id' => $fromWarehouseId,
                'to_warehouse_id' => $toWarehouseId,
                'status' => InventoryTransferStatus::Draft,
                'requested_by' => $userId,
                'notes' => 'Reposición programada de servicio premium para boutique Cusco',
                'approved_by' => null,
                'received_by' => null,
                'sent_at' => null,
                'received_at' => null,
            ],
        );

        $simpleTransfer->items()->delete();

        InventoryTransferItem::query()->create([
            'inventory_transfer_id' => $simpleTransfer->id,
            'product_variant_id' => $simpleVariantId,
            'quantity' => 3,
            'received_quantity' => 0,
        ]);

        $serializedTransfer = InventoryTransfer::query()->updateOrCreate(
            ['code' => 'TRF-SI-CUS-0002'],
            [
                'from_warehouse_id' => $fromWarehouseId,
                'to_warehouse_id' => $toWarehouseId,
                'status' => InventoryTransferStatus::Draft,
                'requested_by' => $userId,
                'notes' => 'Traslado de relojes Rolex para vitrina de fin de semana',
                'approved_by' => null,
                'received_by' => null,
                'sent_at' => null,
                'received_at' => null,
            ],
        );

        $serializedTransfer->items()->delete();

        InventoryTransferItem::query()->create([
            'inventory_transfer_id' => $serializedTransfer->id,
            'product_variant_id' => $serializedVariantId,
            'quantity' => 1,
            'received_quantity' => 0,
        ]);
    }

    private function seedProductImages(): void
    {
        /** @var array<string, string> */
        $imageMap = [
            'watch' => public_path('images/product-watch1.jpg'),
            'watch2' => public_path('images/product-watch2.jpg'),
            'watch3' => public_path('images/product-watch3.jpg'),
            'watch4' => public_path('images/product-watch4.jpg'),
            'ring' => public_path('images/product-ring.jpg'),
            'necklace' => public_path('images/product-necklace.jpg'),
            'bracelet' => public_path('images/product-bracelet.jpg'),
        ];

        /** @var array<string, string> */
        $productImages = [
            'RLX-SVC-001' => 'watch',
            'RLX-SUB-126610LN' => 'watch2',
            'CRT-CARE-001' => 'necklace',
            'LV-CAP-MM-001' => 'bracelet',
        ];

        foreach ($productImages as $sku => $imageKey) {
            $product = Product::query()->where('sku', $sku)->first();

            if (! $product) {
                continue;
            }

            if ($product->getMedia('product')->isNotEmpty()) {
                continue;
            }

            $imagePath = $imageMap[$imageKey] ?? null;

            if ($imagePath && file_exists($imagePath)) {
                $product->addMedia($imagePath)
                    ->preservingOriginal()
                    ->toMediaCollection('product');
            }
        }
    }

    private function seedDraftAdjustments(int $warehouseId, int $simpleVariantId, int $serializedVariantId, ?int $userId): void
    {
        $increaseAdjustment = InventoryAdjustment::query()->updateOrCreate(
            ['code' => 'ADJ-SI-ENTRADA-001'],
            [
                'warehouse_id' => $warehouseId,
                'adjustment_type' => InventoryAdjustmentType::Increase,
                'reason' => 'Ingreso por compra de accesorios de relojería',
                'status' => InventoryAdjustmentStatus::Draft,
                'notes' => 'Pendiente validación documental de factura',
                'created_by' => $userId,
                'confirmed_by' => null,
                'confirmed_at' => null,
            ],
        );

        $increaseAdjustment->items()->delete();

        InventoryAdjustmentItem::query()->create([
            'adjustment_id' => $increaseAdjustment->id,
            'product_variant_id' => $simpleVariantId,
            'quantity' => 5,
            'unit_cost' => 450,
        ]);

        $decreaseAdjustment = InventoryAdjustment::query()->updateOrCreate(
            ['code' => 'ADJ-SI-SALIDA-001'],
            [
                'warehouse_id' => $warehouseId,
                'adjustment_type' => InventoryAdjustmentType::Decrease,
                'reason' => 'Pieza con desperfecto estético en inspección boutique',
                'status' => InventoryAdjustmentStatus::Draft,
                'notes' => 'Pendiente confirmación para mover a estado damaged',
                'created_by' => $userId,
                'confirmed_by' => null,
                'confirmed_at' => null,
            ],
        );

        $decreaseAdjustment->items()->delete();

        InventoryAdjustmentItem::query()->create([
            'adjustment_id' => $decreaseAdjustment->id,
            'product_variant_id' => $serializedVariantId,
            'quantity' => 1,
            'unit_cost' => null,
        ]);
    }
}
