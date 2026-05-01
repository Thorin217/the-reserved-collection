<?php

namespace App\Http\Controllers\Admin;

use App\Enums\WarehouseType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreWarehouseRequest;
use App\Http\Requests\Admin\UpdateWarehouseRequest;
use App\Http\Resources\BranchResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Branch;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    public function index(): Response
    {
        $warehouses = Warehouse::query()
            ->with('branch')
            ->withCount('inventoryStocks')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('inventory/warehouses/index', [
            'warehouses' => WarehouseResource::collection($warehouses),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/warehouses/create', [
            'branches' => BranchResource::collection(Branch::query()->where('is_active', true)->orderBy('name')->get()),
            'warehouseTypes' => array_map(fn (WarehouseType $type) => $type->value, WarehouseType::cases()),
        ]);
    }

    public function store(StoreWarehouseRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['allows_sales'] = $data['allows_sales'] ?? true;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['is_default'] = $data['is_default'] ?? false;

        $warehouse = Warehouse::create($data);

        if ($warehouse->is_default) {
            Warehouse::where('id', '!=', $warehouse->id)->update(['is_default' => false]);
        }

        return redirect()->route('admin.warehouses.index')->with('success', 'Bodega creada exitosamente.');
    }

    public function edit(Warehouse $warehouse): Response
    {
        return Inertia::render('inventory/warehouses/edit', [
            'warehouse' => WarehouseResource::make($warehouse->load('branch')),
            'branches' => BranchResource::collection(Branch::query()->where('is_active', true)->orderBy('name')->get()),
            'warehouseTypes' => array_map(fn (WarehouseType $type) => $type->value, WarehouseType::cases()),
        ]);
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $data = $request->validated();
        $data['allows_sales'] = $data['allows_sales'] ?? $warehouse->allows_sales;
        $data['is_active'] = $data['is_active'] ?? $warehouse->is_active;
        $data['is_default'] = $data['is_default'] ?? false;

        $warehouse->update($data);

        if ($warehouse->is_default) {
            Warehouse::where('id', '!=', $warehouse->id)->update(['is_default' => false]);
        }

        return redirect()->route('admin.warehouses.index')->with('success', 'Bodega actualizada.');
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $hasDependencies = $warehouse->inventoryStocks()->exists()
            || $warehouse->inventoryMovements()->exists()
            || $warehouse->inventoryReservations()->exists()
            || $warehouse->inventoryAdjustments()->exists()
            || $warehouse->productSerials()->exists()
            || $warehouse->outgoingTransfers()->exists()
            || $warehouse->incomingTransfers()->exists();

        if ($hasDependencies) {
            return redirect()->route('admin.warehouses.index')->with('error', 'No puedes eliminar una bodega con historial o movimientos asociados.');
        }

        $warehouse->delete();

        return redirect()->route('admin.warehouses.index')->with('success', 'Bodega eliminada.');
    }
}
