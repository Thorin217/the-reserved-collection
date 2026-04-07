<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryAdjustmentStatus;
use App\Enums\InventoryAdjustmentType;
use App\Enums\InventoryMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInventoryAdjustmentRequest;
use App\Http\Requests\Admin\UpdateInventoryAdjustmentRequest;
use App\Http\Resources\InventoryAdjustmentResource;
use App\Http\Resources\WarehouseResource;
use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentItem;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InventoryAdjustmentController extends Controller
{
    public function index(Request $request): Response
    {
        $status = InventoryAdjustmentStatus::tryFrom((string) $request->status);
        $adjustmentType = InventoryAdjustmentType::tryFrom((string) $request->adjustment_type);

        $adjustments = InventoryAdjustment::query()
            ->with(['warehouse', 'creator', 'confirmer'])
            ->withCount('items')
            ->when($status, fn($query) => $query->where('status', $status->value))
            ->when($adjustmentType, fn($query) => $query->where('adjustment_type', $adjustmentType->value))
            ->when($request->warehouse_id, fn($query, $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->when($request->search, fn($query, $search) => $query->where('code', 'like', "%{$search}%"))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/adjustments/index', [
            'adjustments' => InventoryAdjustmentResource::collection($adjustments),
            'warehouses' => WarehouseResource::collection(Warehouse::query()->orderBy('name')->get()),
            'filters' => $request->only(['status', 'adjustment_type', 'warehouse_id', 'search']),
        ]);
    }

    public function store(StoreInventoryAdjustmentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request) {
            $adjustment = InventoryAdjustment::create([
                'code' => 'ADJ-' . strtoupper(Str::random(8)),
                'warehouse_id' => $data['warehouse_id'],
                'adjustment_type' => InventoryAdjustmentType::from($data['adjustment_type']),
                'reason' => $data['reason'] ?? null,
                'status' => InventoryAdjustmentStatus::Draft,
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            foreach ($data['items'] as $item) {
                InventoryAdjustmentItem::create([
                    'adjustment_id' => $adjustment->id,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? null,
                ]);
            }
        });

        return redirect()->route('admin.inventory.adjustments.index')
            ->with('success', 'Ajuste creado en borrador.');
    }

    public function update(UpdateInventoryAdjustmentRequest $request, InventoryAdjustment $inventoryAdjustment): RedirectResponse
    {
        if ($inventoryAdjustment->status !== InventoryAdjustmentStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede editar un ajuste en borrador.',
            ]);
        }

        $data = $request->validated();

        DB::transaction(function () use ($data, $inventoryAdjustment) {
            $inventoryAdjustment->update([
                'warehouse_id' => $data['warehouse_id'],
                'adjustment_type' => InventoryAdjustmentType::from($data['adjustment_type']),
                'reason' => $data['reason'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $inventoryAdjustment->items()->delete();

            foreach ($data['items'] as $item) {
                InventoryAdjustmentItem::create([
                    'adjustment_id' => $inventoryAdjustment->id,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? null,
                ]);
            }
        });

        return redirect()->route('admin.inventory.adjustments.index')
            ->with('success', 'Ajuste actualizado.');
    }

    public function confirm(InventoryAdjustment $inventoryAdjustment, Request $request): RedirectResponse
    {
        if ($inventoryAdjustment->status !== InventoryAdjustmentStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede confirmar un ajuste en borrador.',
            ]);
        }

        DB::transaction(function () use ($inventoryAdjustment, $request) {
            $inventoryAdjustment->load('items');

            $warehouse = Warehouse::query()
                ->lockForUpdate()
                ->findOrFail($inventoryAdjustment->warehouse_id);

            foreach ($inventoryAdjustment->items as $item) {
                $stock = InventoryStock::query()
                    ->where('warehouse_id', $warehouse->id)
                    ->where('product_variant_id', $item->product_variant_id)
                    ->lockForUpdate()
                    ->first();

                if (! $stock) {
                    $stock = InventoryStock::create([
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $item->product_variant_id,
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'available_quantity' => 0,
                        'average_cost' => 0,
                    ]);
                }

                $currentQuantity = (float) $stock->quantity;
                $currentAvailable = (float) $stock->available_quantity;
                $itemQuantity = (float) $item->quantity;

                if ($inventoryAdjustment->adjustment_type === InventoryAdjustmentType::Decrease && $currentAvailable < $itemQuantity) {
                    throw ValidationException::withMessages([
                        'items' => "Stock insuficiente para la variante {$item->product_variant_id}.",
                    ]);
                }

                if ($inventoryAdjustment->adjustment_type === InventoryAdjustmentType::Increase) {
                    $stock->quantity = $currentQuantity + $itemQuantity;
                    $stock->available_quantity = $currentAvailable + $itemQuantity;
                    $movementType = InventoryMovementType::AdjustmentIn;
                } else {
                    $stock->quantity = $currentQuantity - $itemQuantity;
                    $stock->available_quantity = $currentAvailable - $itemQuantity;
                    $movementType = InventoryMovementType::AdjustmentOut;
                }

                $stock->save();

                InventoryMovement::create([
                    'movement_type' => $movementType,
                    'reference_type' => InventoryAdjustment::class,
                    'reference_id' => $inventoryAdjustment->id,
                    'branch_id' => $warehouse->branch_id,
                    'warehouse_id' => $warehouse->id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $item->quantity,
                    'unit_cost' => $item->unit_cost,
                    'balance_after_movement' => $stock->quantity,
                    'notes' => 'Movimiento por ajuste ' . $inventoryAdjustment->code,
                    'user_id' => $request->user()?->id,
                ]);
            }

            $inventoryAdjustment->update([
                'status' => InventoryAdjustmentStatus::Confirmed,
                'confirmed_by' => $request->user()?->id,
                'confirmed_at' => now(),
            ]);
        });

        return redirect()->route('admin.inventory.adjustments.index')
            ->with('success', 'Ajuste confirmado.');
    }

    public function cancel(InventoryAdjustment $inventoryAdjustment): RedirectResponse
    {
        if ($inventoryAdjustment->status !== InventoryAdjustmentStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede cancelar un ajuste en borrador.',
            ]);
        }

        $inventoryAdjustment->update([
            'status' => InventoryAdjustmentStatus::Cancelled,
        ]);

        return redirect()->route('admin.inventory.adjustments.index')
            ->with('success', 'Ajuste cancelado.');
    }

    public function destroy(InventoryAdjustment $inventoryAdjustment): RedirectResponse
    {
        if ($inventoryAdjustment->status !== InventoryAdjustmentStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede eliminar un ajuste en borrador.',
            ]);
        }

        $inventoryAdjustment->delete();

        return redirect()->route('admin.inventory.adjustments.index')
            ->with('success', 'Ajuste eliminado.');
    }
}
