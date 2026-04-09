<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryMovementType;
use App\Http\Controllers\Controller;
use App\Http\Resources\BranchResource;
use App\Http\Resources\InventoryMovementResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\Warehouse;
use Illuminate\Http\Request;
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
            'filters' => $request->only(['movement_type', 'warehouse_id', 'branch_id', 'reference_type', 'reference_id', 'search']),
        ]);
    }
}
