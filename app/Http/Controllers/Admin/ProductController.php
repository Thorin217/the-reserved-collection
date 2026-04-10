<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $status = ProductStatus::tryFrom((string) $request->status);

        $products = Product::with(['category', 'brand'])
            ->withCount('variants')
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"))
            ->when($status, fn ($q) => $q->where('status', $status->value))
            ->when($request->brand_id, fn ($q, $brandId) => $q->where('brand_id', $brandId))
            ->when($request->category_id, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/products/index', [
            'products' => ProductResource::collection($products),
            'brands' => BrandResource::collection(Brand::orderBy('name')->get()),
            'categories' => CategoryResource::collection(Category::orderBy('name')->get()),
            'filters' => $request->only(['search', 'status', 'brand_id', 'category_id']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/products/create', [
            'brands' => BrandResource::collection(Brand::where('is_active', true)->orderBy('name')->get()),
            'categories' => CategoryResource::collection(Category::where('is_active', true)->orderBy('name')->get()),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']).'-'.Str::random(6);
        $data['track_stock'] = $data['track_stock'] ?? true;
        $data['has_serial_numbers'] = $data['has_serial_numbers'] ?? false;

        DB::transaction(function () use ($data) {
            $product = Product::create($data);

            foreach ($data['variants'] as $variantData) {
                ProductVariant::create([
                    ...$variantData,
                    'product_id' => $product->id,
                    'is_active' => true,
                ]);
            }
        });

        return redirect()->route('admin.products.index')->with('success', 'Producto creado exitosamente.');
    }

    public function edit(Product $product): Response
    {
        $product->load(['variants', 'category', 'brand']);

        return Inertia::render('inventory/products/edit', [
            'product' => ProductResource::make($product),
            'brands' => BrandResource::collection(Brand::where('is_active', true)->orderBy('name')->get()),
            'categories' => CategoryResource::collection(Category::where('is_active', true)->orderBy('name')->get()),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $data['track_stock'] = $data['track_stock'] ?? $product->track_stock;
        $data['has_serial_numbers'] = $data['has_serial_numbers'] ?? $product->has_serial_numbers;

        DB::transaction(function () use ($data, $product) {
            $product->update([
                'category_id' => $data['category_id'],
                'brand_id' => $data['brand_id'],
                'name' => $data['name'],
                'sku' => $data['sku'],
                'description' => $data['description'] ?? null,
                'product_type' => $data['product_type'],
                'track_stock' => $data['track_stock'],
                'has_serial_numbers' => $data['has_serial_numbers'],
                'status' => $data['status'],
            ]);

            if (! array_key_exists('variants', $data)) {
                return;
            }

            $existingVariantIds = $product->variants()
                ->pluck('id')
                ->all();

            foreach ($data['variants'] as $variantData) {
                $variantId = isset($variantData['id']) ? (int) $variantData['id'] : null;

                $payload = [
                    'sku' => $variantData['sku'],
                    'cost' => $variantData['cost'] ?? null,
                    'price' => $variantData['price'] ?? null,
                    'compare_price' => $variantData['compare_price'] ?? null,
                    'is_active' => true,
                ];

                if ($variantId && in_array($variantId, $existingVariantIds, true)) {
                    $product->variants()->whereKey($variantId)->update($payload);

                    continue;
                }

                $product->variants()->create($payload);
            }
        });

        return redirect()->route('admin.products.index')->with('success', 'Producto actualizado.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('admin.products.index')->with('success', 'Producto eliminado.');
    }
}
