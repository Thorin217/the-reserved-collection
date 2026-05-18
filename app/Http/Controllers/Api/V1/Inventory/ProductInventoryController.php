<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Enums\AttributeEntityLevel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Api\V1\Inventory\IndexInventoryProductsRequest;
use App\Http\Resources\Api\V1\InventoryProductResource;
use App\Models\Attribute;
use App\Models\Product;
use App\Models\ProductAttributeValue;
use App\Models\ProductVariant;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductInventoryController extends Controller
{
    public function index(IndexInventoryProductsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $includes = $this->parseIncludes($validated['include'] ?? null);
        $perPage = (int) ($validated['per_page'] ?? 15);
        $direction = $validated['direction'] ?? 'desc';
        $sort = $validated['sort'] ?? 'created_at';

        $products = Product::query()
            ->with(['brand', 'category'])
            ->withSum('inventoryStocks as inventory_stocks_sum_quantity', 'quantity')
            ->withSum('inventoryStocks as inventory_stocks_sum_reserved_quantity', 'reserved_quantity')
            ->withSum('inventoryStocks as inventory_stocks_sum_available_quantity', 'available_quantity')
            ->when(in_array('variants', $includes, true), function (Builder $query): void {
                $query->with([
                    'variants' => fn ($variantQuery) => $variantQuery
                        ->with('inventoryStocks')
                        ->orderBy('id'),
                ]);
            })
            ->when(in_array('stocks', $includes, true), function (Builder $query): void {
                $query->with([
                    'inventoryStocks' => fn ($stockQuery) => $stockQuery
                        ->with('warehouse')
                        ->orderBy('warehouse_id')
                        ->orderBy('product_variant_id'),
                ]);
            })
            ->when(isset($validated['search']), function (Builder $query) use ($validated): void {
                $search = $validated['search'];

                $query->where(function (Builder $searchQuery) use ($search): void {
                    $searchQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhereHas('variants', fn (Builder $variantQuery) => $variantQuery->where('sku', 'like', "%{$search}%"));
                });
            })
            ->when(isset($validated['brand_id']), fn (Builder $query) => $query->where('brand_id', $validated['brand_id']))
            ->when(isset($validated['category_id']), fn (Builder $query) => $query->where('category_id', $validated['category_id']))
            ->when(isset($validated['warehouse_id']), fn (Builder $query) => $query->whereHas('inventoryStocks', fn (Builder $stockQuery) => $stockQuery->where('warehouse_id', $validated['warehouse_id'])))
            ->when(array_key_exists('has_stock', $validated), function (Builder $query) use ($validated): void {
                if ((bool) $validated['has_stock']) {
                    $query->whereHas('inventoryStocks', fn (Builder $stockQuery) => $stockQuery->where('available_quantity', '>', 0));
                } else {
                    $query->whereDoesntHave('inventoryStocks', fn (Builder $stockQuery) => $stockQuery->where('available_quantity', '>', 0));
                }
            })
            ->when(isset($validated['type']), fn (Builder $query) => $query->where('product_type', $validated['type']))
            ->when(array_key_exists('is_active', $validated), function (Builder $query) use ($validated): void {
                if ((bool) $validated['is_active']) {
                    $query->where('status', 'active');
                } else {
                    $query->where('status', '!=', 'active');
                }
            })
            ->when(isset($validated['updated_from']), fn (Builder $query) => $query->whereDate('updated_at', '>=', $validated['updated_from']))
            ->when(isset($validated['updated_to']), fn (Builder $query) => $query->whereDate('updated_at', '<=', $validated['updated_to']))
            ->when($sort === 'stock', fn (Builder $query) => $query->orderBy('inventory_stocks_sum_available_quantity', $direction))
            ->when($sort !== 'stock', fn (Builder $query) => $query->orderBy($sort, $direction))
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(
            'Inventory products retrieved successfully.',
            InventoryProductResource::collection($products)->response()->getData(true)
        );
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']).'-'.Str::random(6);
        $data['track_stock'] = $data['track_stock'] ?? true;
        $data['has_serial_numbers'] = $data['has_serial_numbers'] ?? false;

        $product = DB::transaction(function () use ($data): Product {
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

            $this->syncProductLevelAttributes($product, $data['attributes'] ?? []);

            return $product;
        });

        $product->load(['brand', 'category', 'variants.inventoryStocks']);
        $product->loadSum('inventoryStocks as inventory_stocks_sum_quantity', 'quantity');
        $product->loadSum('inventoryStocks as inventory_stocks_sum_reserved_quantity', 'reserved_quantity');
        $product->loadSum('inventoryStocks as inventory_stocks_sum_available_quantity', 'available_quantity');

        return ApiResponse::success(
            'Product created successfully.',
            InventoryProductResource::make($product)->resolve(),
            201
        );
    }

    /**
     * @return array<int, string>
     */
    private function parseIncludes(?string $include): array
    {
        if ($include === null || trim($include) === '') {
            return [];
        }

        return collect(explode(',', $include))
            ->map(fn (string $value): string => trim($value))
            ->filter(fn (string $value): bool => in_array($value, ['brand', 'category', 'variants', 'stocks'], true))
            ->unique()
            ->values()
            ->all();
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
            ->filter(fn (array $attribute): bool => $attribute['attribute_id'] > 0)
            ->values();

        $targetQuery = ProductAttributeValue::query()
            ->when($productId !== null, fn (Builder $query) => $query->where('product_id', $productId), fn (Builder $query) => $query->whereNull('product_id'))
            ->when($productVariantId !== null, fn (Builder $query) => $query->where('product_variant_id', $productVariantId), fn (Builder $query) => $query->whereNull('product_variant_id'))
            ->when($productSerialId !== null, fn (Builder $query) => $query->where('product_serial_id', $productSerialId), fn (Builder $query) => $query->whereNull('product_serial_id'))
            ->whereHas('attribute', fn (Builder $query) => $query->forEntityLevel($level));

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
                $errors["attributes.{$index}.attribute_id"] = 'Selected attribute is invalid for this level.';

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
