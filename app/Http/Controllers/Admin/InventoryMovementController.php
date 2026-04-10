<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryMovementType;
use App\Enums\ProductSerialStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInventoryOpeningRequest;
use App\Http\Resources\BranchResource;
use App\Http\Resources\InventoryMovementResource;
use App\Http\Resources\ProductVariantResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InventoryMovementController extends Controller
{
    public function index(Request $request): Response
    {
        $movementType = InventoryMovementType::tryFrom((string) $request->movement_type);

        $movements = InventoryMovement::query()
            ->with(['branch', 'warehouse', 'productVariant.product', 'serial', 'user'])
            ->when($movementType, fn ($query) => $query->where('movement_type', $movementType->value))
            ->when($request->warehouse_id, fn ($query, $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->when($request->branch_id, fn ($query, $branchId) => $query->where('branch_id', $branchId))
            ->when($request->reference_type, fn ($query, $referenceType) => $query->where('reference_type', $referenceType))
            ->when($request->reference_id, fn ($query, $referenceId) => $query->where('reference_id', $referenceId))
            ->when($request->search, function ($query, $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->whereHas('productVariant', fn ($variantQuery) => $variantQuery->where('sku', 'like', "%{$search}%"))
                        ->orWhereHas('serial', fn ($serialQuery) => $serialQuery->where('serial_number', 'like', "%{$search}%"))
                        ->orWhere('reference_type', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('inventory/movements/index', [
            'movements' => InventoryMovementResource::collection($movements),
            'branches' => BranchResource::collection(Branch::query()->orderBy('name')->get()),
            'warehouses' => WarehouseResource::collection(Warehouse::query()->orderBy('name')->get()),
            'variants' => ProductVariantResource::collection(
                ProductVariant::query()->with('product')->where('is_active', true)->orderBy('sku')->get()
            ),
            'filters' => $request->only(['movement_type', 'warehouse_id', 'branch_id', 'reference_type', 'reference_id', 'search']),
        ]);
    }

    public function opening(StoreInventoryOpeningRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request): void {
            $variant = ProductVariant::query()
                ->with('product')
                ->lockForUpdate()
                ->findOrFail($data['product_variant_id']);

            $warehouse = Warehouse::query()
                ->lockForUpdate()
                ->findOrFail($data['warehouse_id']);

            $quantity = (float) $data['quantity'];
            $unitCost = isset($data['unit_cost']) ? (float) $data['unit_cost'] : null;
            $isSerialized = (bool) $variant->product?->has_serial_numbers;

            $serialNumbers = collect($data['serial_numbers'] ?? [])
                ->map(fn (string $serial) => trim($serial))
                ->filter(fn (string $serial) => $serial !== '')
                ->values();

            if ($isSerialized) {
                if ($quantity !== (float) (int) $quantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'Serialized variants require an integer quantity.',
                    ]);
                }

                if ($serialNumbers->count() !== (int) $quantity) {
                    throw ValidationException::withMessages([
                        'serial_numbers' => "You must provide exactly {$quantity} serial numbers.",
                    ]);
                }

                if ($serialNumbers->duplicates()->isNotEmpty()) {
                    throw ValidationException::withMessages([
                        'serial_numbers' => 'Serial numbers must be unique in the same opening operation.',
                    ]);
                }

                $existingSerials = ProductSerial::query()
                    ->whereIn('serial_number', $serialNumbers->all())
                    ->exists();

                if ($existingSerials) {
                    throw ValidationException::withMessages([
                        'serial_numbers' => 'One or more serial numbers already exist in the system.',
                    ]);
                }
            }

            $stock = InventoryStock::query()
                ->where('warehouse_id', $warehouse->id)
                ->where('product_variant_id', $variant->id)
                ->lockForUpdate()
                ->first();

            if (! $stock) {
                $stock = InventoryStock::create([
                    'warehouse_id' => $warehouse->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                    'available_quantity' => 0,
                    'average_cost' => 0,
                ]);
            }

            $previousQuantity = (float) $stock->quantity;
            $previousAverageCost = (float) ($stock->average_cost ?? 0);
            $newQuantity = $previousQuantity + $quantity;

            $stock->quantity = $newQuantity;
            $stock->available_quantity = (float) $stock->available_quantity + $quantity;

            if ($unitCost !== null) {
                $stock->average_cost = $newQuantity <= 0
                    ? 0
                    : (($previousQuantity * $previousAverageCost) + ($quantity * $unitCost)) / $newQuantity;
            }

            $stock->save();

            $notes = $data['notes'] ?? 'Opening stock registration';

            if ($isSerialized) {
                foreach ($serialNumbers as $serialNumber) {
                    $serial = ProductSerial::create([
                        'product_variant_id' => $variant->id,
                        'serial_number' => $serialNumber,
                        'warehouse_id' => $warehouse->id,
                        'status' => ProductSerialStatus::Available,
                    ]);

                    InventoryMovement::create([
                        'movement_type' => InventoryMovementType::Opening,
                        'reference_type' => ProductSerial::class,
                        'reference_id' => $serial->id,
                        'branch_id' => $warehouse->branch_id,
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $variant->id,
                        'serial_id' => $serial->id,
                        'quantity' => 1,
                        'unit_cost' => $unitCost,
                        'balance_after_movement' => $stock->quantity,
                        'notes' => $notes.' · Serial '.$serialNumber,
                        'user_id' => $request->user()?->id,
                    ]);
                }

                return;
            }

            InventoryMovement::create([
                'movement_type' => InventoryMovementType::Opening,
                'reference_type' => ProductVariant::class,
                'reference_id' => $variant->id,
                'branch_id' => $warehouse->branch_id,
                'warehouse_id' => $warehouse->id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'balance_after_movement' => $stock->quantity,
                'notes' => $notes,
                'user_id' => $request->user()?->id,
            ]);
        });

        return redirect()->route('admin.inventory.movements.index')
            ->with('success', 'Opening stock was registered successfully.');
    }
}
