<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Enums\AttributeEntityLevel;
use App\Enums\InventoryMovementType;
use App\Enums\ProductSerialStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductSerialRequest;
use App\Http\Resources\ProductSerialResource;
use App\Models\Attribute;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ProductAttributeValue;
use App\Models\ProductSerial;
use App\Models\Warehouse;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProductSerialController extends Controller
{
    public function store(StoreProductSerialRequest $request, Product $product): JsonResponse
    {
        $serial = DB::transaction(function () use ($request): ProductSerial {
            $data = $request->validated();

            $serial = ProductSerial::create($data);

            $this->syncSerialAttributes($serial, $data['attributes'] ?? []);

            $this->syncSerialStock(
                productVariantId: $serial->product_variant_id,
                fromWarehouseId: null,
                fromStatus: null,
                toWarehouseId: $serial->warehouse_id,
                toStatus: $serial->status,
            );

            $projection = $this->stockProjectionForSerial($serial->warehouse_id, $serial->status);

            if ($projection['quantity'] > 0 && $serial->warehouse_id !== null) {
                $warehouse = Warehouse::query()->find($serial->warehouse_id);
                $stock = InventoryStock::query()
                    ->where('warehouse_id', $serial->warehouse_id)
                    ->where('product_variant_id', $serial->product_variant_id)
                    ->first();

                if ($warehouse && $stock) {
                    $serial->inventoryMovements()->create([
                        'movement_type' => InventoryMovementType::Opening,
                        'reference_type' => ProductSerial::class,
                        'reference_id' => $serial->id,
                        'branch_id' => $warehouse->branch_id,
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $serial->product_variant_id,
                        'serial_id' => $serial->id,
                        'quantity' => 1,
                        'unit_cost' => null,
                        'balance_after_movement' => $stock->quantity,
                        'notes' => 'Ingreso inicial de serial '.$serial->serial_number,
                        'user_id' => $request->user()?->id,
                    ]);
                }
            }

            return $serial;
        });

        $serial->load(['productVariant.product', 'warehouse', 'attributeValues.attribute', 'attributeValues.attributeOption']);

        return ApiResponse::success(
            'Product serial created successfully.',
            ProductSerialResource::make($serial)->resolve(),
            201
        );
    }

    private function syncSerialStock(
        int $productVariantId,
        ?int $fromWarehouseId,
        ProductSerialStatus|string|null $fromStatus,
        ?int $toWarehouseId,
        ProductSerialStatus|string|null $toStatus,
    ): void {
        $fromProjection = $this->stockProjectionForSerial($fromWarehouseId, $fromStatus);
        $toProjection = $this->stockProjectionForSerial($toWarehouseId, $toStatus);

        if ($fromWarehouseId !== null) {
            $this->applyStockDelta(
                warehouseId: $fromWarehouseId,
                productVariantId: $productVariantId,
                quantityDelta: -$fromProjection['quantity'],
                reservedDelta: -$fromProjection['reserved_quantity'],
                availableDelta: -$fromProjection['available_quantity'],
            );
        }

        if ($toWarehouseId !== null) {
            $this->applyStockDelta(
                warehouseId: $toWarehouseId,
                productVariantId: $productVariantId,
                quantityDelta: $toProjection['quantity'],
                reservedDelta: $toProjection['reserved_quantity'],
                availableDelta: $toProjection['available_quantity'],
            );
        }
    }

    /**
     * @return array{quantity: float, reserved_quantity: float, available_quantity: float}
     */
    private function stockProjectionForSerial(?int $warehouseId, ProductSerialStatus|string|null $status): array
    {
        if ($warehouseId === null || $status === null) {
            return [
                'quantity' => 0,
                'reserved_quantity' => 0,
                'available_quantity' => 0,
            ];
        }

        $statusValue = $status instanceof ProductSerialStatus ? $status->value : $status;

        return match ($statusValue) {
            ProductSerialStatus::Available->value, ProductSerialStatus::Returned->value => [
                'quantity' => 1,
                'reserved_quantity' => 0,
                'available_quantity' => 1,
            ],
            ProductSerialStatus::Reserved->value => [
                'quantity' => 1,
                'reserved_quantity' => 1,
                'available_quantity' => 0,
            ],
            default => [
                'quantity' => 0,
                'reserved_quantity' => 0,
                'available_quantity' => 0,
            ],
        };
    }

    private function applyStockDelta(
        int $warehouseId,
        int $productVariantId,
        float $quantityDelta,
        float $reservedDelta,
        float $availableDelta,
    ): void {
        if ($quantityDelta === 0.0 && $reservedDelta === 0.0 && $availableDelta === 0.0) {
            return;
        }

        $stock = InventoryStock::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_variant_id', $productVariantId)
            ->lockForUpdate()
            ->first();

        if (! $stock) {
            if ($quantityDelta <= 0 && $reservedDelta <= 0 && $availableDelta <= 0) {
                return;
            }

            $stock = InventoryStock::create([
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $productVariantId,
                'quantity' => 0,
                'reserved_quantity' => 0,
                'available_quantity' => 0,
                'average_cost' => null,
            ]);
        }

        $stock->quantity = max(0, (float) $stock->quantity + $quantityDelta);
        $stock->reserved_quantity = max(0, (float) $stock->reserved_quantity + $reservedDelta);
        $stock->available_quantity = max(0, (float) $stock->available_quantity + $availableDelta);
        $stock->save();
    }

    /**
     * @param  array<int, array<string, mixed>>  $attributesPayload
     */
    private function syncSerialAttributes(ProductSerial $serial, array $attributesPayload): void
    {
        $attributes = collect($attributesPayload)
            ->map(fn (array $attribute): array => [
                'attribute_id' => (int) ($attribute['attribute_id'] ?? 0),
                'attribute_option_id' => isset($attribute['attribute_option_id']) && $attribute['attribute_option_id'] !== ''
                    ? (int) $attribute['attribute_option_id']
                    : null,
            ])
            ->filter(fn (array $attribute): bool => $attribute['attribute_id'] > 0)
            ->values();

        ProductAttributeValue::query()
            ->where('product_serial_id', $serial->id)
            ->whereHas('attribute', fn ($query) => $query->forEntityLevel(AttributeEntityLevel::Serial))
            ->delete();

        if ($attributes->isEmpty()) {
            return;
        }

        $availableAttributes = Attribute::query()
            ->where('is_active', true)
            ->forEntityLevel(AttributeEntityLevel::Serial)
            ->whereIn('id', $attributes->pluck('attribute_id')->all())
            ->with('attributeOptions')
            ->get()
            ->keyBy('id');

        foreach ($attributes as $attributePayload) {
            $attribute = $availableAttributes->get($attributePayload['attribute_id']);

            if (! $attribute) {
                continue;
            }

            $optionId = $attributePayload['attribute_option_id'];

            if (! $optionId || ! $attribute->attributeOptions->contains('id', $optionId)) {
                continue;
            }

            ProductAttributeValue::query()->create([
                'product_id' => $serial->productVariant?->product_id,
                'product_variant_id' => $serial->product_variant_id,
                'product_serial_id' => $serial->id,
                'attribute_id' => $attribute->id,
                'attribute_option_id' => $optionId,
            ]);
        }
    }
}
