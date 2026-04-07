<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryStockResource;
use App\Http\Resources\WarehouseResource;
use App\Models\InventoryStock;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryStockController extends Controller
{
    public function index(Request $request): Response
    {
        $stocks = InventoryStock::query()
            ->with(['warehouse', 'productVariant.product'])
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

        return Inertia::render('inventory/stocks/index', [
            'stocks' => InventoryStockResource::collection($stocks),
            'warehouses' => WarehouseResource::collection(Warehouse::query()->orderBy('name')->get()),
            'filters' => $request->only(['warehouse_id', 'search']),
        ]);
    }
}
