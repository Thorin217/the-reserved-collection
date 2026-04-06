<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductSerialRequest;
use App\Http\Requests\Admin\UpdateProductSerialRequest;
use App\Http\Resources\InventoryMovementResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductSerialResource;
use App\Http\Resources\WarehouseResource;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
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
        ProductSerial::create($request->validated());

        return redirect()->route('admin.products.serials.index', $product)->with('success', 'Serial registrado.');
    }

    public function update(UpdateProductSerialRequest $request, Product $product, ProductSerial $serial): RedirectResponse
    {
        $serial->update($request->validated());

        return redirect()->route('admin.products.serials.index', $product)->with('success', 'Serial actualizado.');
    }

    public function destroy(Product $product, ProductSerial $serial): RedirectResponse
    {
        $serial->delete();

        return redirect()->route('admin.products.serials.index', $product)->with('success', 'Serial eliminado.');
    }
}
