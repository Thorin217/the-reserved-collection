<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryReservationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryReservationResource;
use App\Http\Resources\WarehouseResource;
use App\Models\InventoryReservation;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryReservationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = InventoryReservationStatus::tryFrom((string) $request->status);

        $reservations = InventoryReservation::query()
            ->with(['warehouse', 'productVariant.product', 'reference'])
            ->when($status, fn ($query) => $query->where('status', $status->value))
            ->when($request->warehouse_id, fn ($query, $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->when($request->search, function ($query, $search) {
                $query->whereHas('productVariant', function ($variantQuery) use ($search) {
                    $variantQuery->where('sku', 'like', "%{$search}%")
                        ->orWhereHas('product', fn ($productQuery) => $productQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/reservations/index', [
            'reservations' => InventoryReservationResource::collection($reservations),
            'warehouses' => WarehouseResource::collection(Warehouse::query()->orderBy('name')->get()),
            'filters' => $request->only(['status', 'warehouse_id', 'search']),
        ]);
    }
}
