<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryMovementType;
use App\Enums\ProductSerialStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductSerialRequest;
use App\Http\Requests\Admin\UpdateProductSerialRequest;
use App\Http\Resources\InventoryMovementResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductSerialResource;
use App\Http\Resources\WarehouseResource;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductSerialController extends Controller
{
    public function index(Product $product): Response
    {
        $product->load(['brand', 'category', 'variants.serials.warehouse']);

        $serials = ProductSerial::whereHas('productVariant', fn ($q) => $q->where('product_id', $product->id))
            ->with(['productVariant', 'warehouse'])
            ->latest()
            ->paginate(30);

        $movements = InventoryMovement::whereHas('productVariant', fn ($q) => $q->where('product_id', $product->id))
            ->with(['user', 'warehouse'])
            ->latest()
            ->limit(50)
            ->get();

        return Inertia::render('inventory/products/serials', [
            'product' => ProductResource::make($product),
            'serials' => ProductSerialResource::collection($serials),
            'movements' => InventoryMovementResource::collection($movements),
            'warehouses' => WarehouseResource::collection(Warehouse::orderBy('name')->get()),
        ]);
    }

    public function store(StoreProductSerialRequest $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $data = $request->validated();

            $serial = ProductSerial::create($data);

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
                    InventoryMovement::create([
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
        });

        return redirect()
            ->route('admin.products.serials.index', ['product' => $this->resolveProductRouteKey($request, $product)])
            ->with('success', 'Serial registrado.');
    }

    public function update(UpdateProductSerialRequest $request, Product $product, ProductSerial $serial): RedirectResponse
    {
        DB::transaction(function () use ($request, $serial) {
            $fromWarehouseId = $serial->warehouse_id;
            $fromStatus = $serial->status;

            $serial->update($request->validated());

            $this->syncSerialStock(
                productVariantId: $serial->product_variant_id,
                fromWarehouseId: $fromWarehouseId,
                fromStatus: $fromStatus,
                toWarehouseId: $serial->warehouse_id,
                toStatus: $serial->status,
            );
        });

        return redirect()
            ->route('admin.products.serials.index', ['product' => $this->resolveProductRouteKey($request, $product)])
            ->with('success', 'Serial actualizado.');
    }

    public function destroy(Product $product, ProductSerial $serial): RedirectResponse
    {
        DB::transaction(function () use ($serial) {
            $this->syncSerialStock(
                productVariantId: $serial->product_variant_id,
                fromWarehouseId: $serial->warehouse_id,
                fromStatus: $serial->status,
                toWarehouseId: null,
                toStatus: null,
            );

            $serial->delete();
        });

        return redirect()
            ->route('admin.products.serials.index', ['product' => $product->getKey()])
            ->with('success', 'Serial eliminado.');
    }

    private function resolveProductRouteKey(StoreProductSerialRequest|UpdateProductSerialRequest $request, Product $product): int|string
    {
        $routeProduct = $request->route('product');

        if ($routeProduct instanceof Product) {
            return $routeProduct->getKey();
        }

        if (is_scalar($routeProduct) && (string) $routeProduct !== '') {
            return (string) $routeProduct;
        }

        return $product->getKey();
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
}
