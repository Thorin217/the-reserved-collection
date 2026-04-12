<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttributeEntityLevel;
use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\AttributeResource;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductAttributeValue;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
            'attributes' => AttributeResource::collection($this->productLevelAttributes()),
            'variantAttributes' => AttributeResource::collection($this->variantLevelAttributes()),
            'serialAttributes' => AttributeResource::collection($this->serialLevelAttributes()),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']).'-'.Str::random(6);
        $data['track_stock'] = $data['track_stock'] ?? true;
        $data['has_serial_numbers'] = $data['has_serial_numbers'] ?? false;

        DB::transaction(function () use ($data, $request) {
            $product = Product::create($data);

            foreach ($data['variants'] as $variantData) {
                $variant = ProductVariant::create([
                    ...$variantData,
                    'product_id' => $product->id,
                    'is_active' => true,
                ]);

                $this->syncAttributeOptionsByLevel(
                    attributesPayload: $variantData['attributes'] ?? [],
                    level: AttributeEntityLevel::Variant,
                    productId: $product->id,
                    productVariantId: $variant->id,
                    productSerialId: null,
                );
            }

            if ($request->hasFile('image')) {
                $product
                    ->addMediaFromRequest('image')
                    ->toMediaCollection('product');
            }

            $this->syncProductLevelAttributes($product, $data['attributes'] ?? []);
        });

        return redirect()->route('admin.products.index')->with('success', 'Producto creado exitosamente.');
    }

    public function edit(Product $product): Response
    {
        $product->load([
            'variants',
            'category',
            'brand',
            'variants.attributeValues' => fn ($query) => $query
                ->whereNull('product_serial_id')
                ->with(['attribute.attributeOptions', 'attributeOption']),
            'attributeValues' => fn ($query) => $query
                ->whereNull('product_variant_id')
                ->whereNull('product_serial_id')
                ->with(['attribute.attributeOptions', 'attributeOption']),
        ]);

        return Inertia::render('inventory/products/edit', [
            'product' => ProductResource::make($product),
            'brands' => BrandResource::collection(Brand::where('is_active', true)->orderBy('name')->get()),
            'categories' => CategoryResource::collection(Category::where('is_active', true)->orderBy('name')->get()),
            'attributes' => AttributeResource::collection($this->productLevelAttributes()),
            'variantAttributes' => AttributeResource::collection($this->variantLevelAttributes()),
            'serialAttributes' => AttributeResource::collection($this->serialLevelAttributes()),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $data['track_stock'] = $data['track_stock'] ?? $product->track_stock;
        $data['has_serial_numbers'] = $data['has_serial_numbers'] ?? $product->has_serial_numbers;

        DB::transaction(function () use ($data, $product, $request) {
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

                    $this->syncAttributeOptionsByLevel(
                        attributesPayload: $variantData['attributes'] ?? [],
                        level: AttributeEntityLevel::Variant,
                        productId: $product->id,
                        productVariantId: $variantId,
                        productSerialId: null,
                    );

                    continue;
                }

                $variant = $product->variants()->create($payload);

                $this->syncAttributeOptionsByLevel(
                    attributesPayload: $variantData['attributes'] ?? [],
                    level: AttributeEntityLevel::Variant,
                    productId: $product->id,
                    productVariantId: $variant->id,
                    productSerialId: null,
                );
            }

            if ($request->hasFile('image')) {
                $product->clearMediaCollection('product');
                $product
                    ->addMediaFromRequest('image')
                    ->toMediaCollection('product');
            }

            $this->syncProductLevelAttributes($product, $data['attributes'] ?? []);
        });

        return redirect()->route('admin.products.index')->with('success', 'Producto actualizado.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('admin.products.index')->with('success', 'Producto eliminado.');
    }

    /**
     * @return Collection<int, Attribute>
     */
    private function productLevelAttributes()
    {
        return Attribute::query()
            ->where('is_active', true)
            ->forEntityLevel(AttributeEntityLevel::Product)
            ->with(['attributeOptions' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')])
            ->orderBy('is_required', 'desc')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return Collection<int, Attribute>
     */
    private function variantLevelAttributes()
    {
        return Attribute::query()
            ->where('is_active', true)
            ->forEntityLevel(AttributeEntityLevel::Variant)
            ->with(['attributeOptions' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')])
            ->orderBy('is_required', 'desc')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return Collection<int, Attribute>
     */
    private function serialLevelAttributes()
    {
        return Attribute::query()
            ->where('is_active', true)
            ->forEntityLevel(AttributeEntityLevel::Serial)
            ->with(['attributeOptions' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')])
            ->orderBy('is_required', 'desc')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  array<int, array<string, mixed>>  $attributesPayload
     */
    private function syncProductLevelAttributes(Product $product, array $attributesPayload): void
    {
        $this->syncAttributeOptionsByLevel(
            attributesPayload: $attributesPayload,
            level: AttributeEntityLevel::Product,
            productId: $product->id,
            productVariantId: null,
            productSerialId: null,
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $attributesPayload
     */
    private function syncAttributeOptionsByLevel(
        array $attributesPayload,
        AttributeEntityLevel $level,
        ?int $productId,
        ?int $productVariantId,
        ?int $productSerialId,
    ): void {
        $attributesCollection = collect($attributesPayload)
            ->map(function (array $attribute): array {
                return [
                    'attribute_id' => (int) ($attribute['attribute_id'] ?? 0),
                    'attribute_option_id' => isset($attribute['attribute_option_id']) && $attribute['attribute_option_id'] !== ''
                        ? (int) $attribute['attribute_option_id']
                        : null,
                    'value' => $attribute['value'] ?? null,
                ];
            })
            ->filter(fn (array $attribute) => $attribute['attribute_id'] > 0)
            ->values();

        $targetQuery = ProductAttributeValue::query()
            ->when($productId !== null, fn ($query) => $query->where('product_id', $productId), fn ($query) => $query->whereNull('product_id'))
            ->when($productVariantId !== null, fn ($query) => $query->where('product_variant_id', $productVariantId), fn ($query) => $query->whereNull('product_variant_id'))
            ->when($productSerialId !== null, fn ($query) => $query->where('product_serial_id', $productSerialId), fn ($query) => $query->whereNull('product_serial_id'))
            ->whereHas('attribute', fn ($query) => $query->forEntityLevel($level));

        if ($attributesCollection->isEmpty()) {
            $targetQuery->delete();

            return;
        }

        $attributeIds = $attributesCollection->pluck('attribute_id')->all();

        $attributes = Attribute::query()
            ->whereIn('id', $attributeIds)
            ->where('is_active', true)
            ->forEntityLevel($level)
            ->with('attributeOptions')
            ->get()
            ->keyBy('id');

        $rows = [];
        $errors = [];

        foreach ($attributesCollection as $index => $payload) {
            /** @var Attribute|null $attribute */
            $attribute = $attributes->get($payload['attribute_id']);

            if (! $attribute) {
                $errors["attributes.{$index}.attribute_id"] = 'Selected attribute is invalid for product level.';

                continue;
            }

            $row = [
                'product_id' => $productId,
                'attribute_id' => $attribute->id,
                'product_variant_id' => $productVariantId,
                'product_serial_id' => $productSerialId,
                'value_text' => null,
                'value_textarea' => null,
                'value_number' => null,
                'value_decimal' => null,
                'value_boolean' => null,
                'value_date' => null,
                'attribute_option_id' => null,
            ];

            $optionId = $payload['attribute_option_id'];

            if ($attribute->is_required && ! $optionId) {
                $errors["attributes.{$index}.attribute_option_id"] = "{$attribute->name} is required.";

                continue;
            }

            if (! $optionId) {
                continue;
            }

            if (! $attribute->attributeOptions->contains('id', $optionId)) {
                $errors["attributes.{$index}.attribute_option_id"] = 'Selected option does not belong to the selected attribute.';

                continue;
            }

            $row['attribute_option_id'] = $optionId;
            $rows[] = $row;
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        $targetQuery->delete();

        foreach ($rows as $row) {
            ProductAttributeValue::create($row);
        }
    }
}
