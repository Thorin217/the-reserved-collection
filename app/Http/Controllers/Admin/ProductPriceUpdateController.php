<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttributeEntityLevel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductPriceUpdatePreviewRequest;
use App\Http\Requests\Admin\ProductPriceUpdateStoreRequest;
use App\Http\Resources\AttributeResource;
use App\Models\Attribute;
use App\Models\PriceUpdate;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductPriceUpdateController extends Controller
{
    public function index(): Response
    {
        return $this->renderPage([], []);
    }

    public function preview(ProductPriceUpdatePreviewRequest $request): Response
    {
        $filters = $this->normalizeFilters($request->validated('filters'));

        return $this->renderPage($filters, $this->resolvePreviewVariants($filters));
    }

    public function store(ProductPriceUpdateStoreRequest $request): Response
    {
        $validated = $request->validated();
        $filters = $this->normalizeFilters($validated['filters']);
        $selectedVariantIds = collect($validated['variant_ids'])->map(fn ($id) => (int) $id)->unique()->values();

        $candidateQuery = $this->buildCandidateVariantsQuery($filters);

        $variantsToUpdate = (clone $candidateQuery)
            ->whereIn('id', $selectedVariantIds)
            ->with(['product:id,name,sku'])
            ->lockForUpdate()
            ->get();

        if ($variantsToUpdate->count() !== $selectedVariantIds->count()) {
            throw ValidationException::withMessages([
                'variant_ids' => 'One or more selected variants no longer match the filters.',
            ]);
        }

        $changeValue = (float) $validated['change_value'];
        $multiplier = 1 + ($changeValue / 100);
        $createdBy = $request->user()?->id;

        DB::transaction(function () use ($validated, $filters, $variantsToUpdate, $changeValue, $multiplier, $createdBy): void {
            $priceUpdate = PriceUpdate::query()->create([
                'name' => $validated['name'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'change_type' => $validated['change_type'],
                'change_value' => $changeValue,
                'affected_variants_count' => $variantsToUpdate->count(),
                'created_by' => $createdBy,
            ]);

            $priceUpdate->filters()->createMany(
                collect($filters)
                    ->map(fn (array $filter): array => [
                        'entity_level' => AttributeEntityLevel::Product->value,
                        'attribute_id' => $filter['attribute_id'],
                        'attribute_option_id' => $filter['attribute_option_id'],
                    ])
                    ->all()
            );

            $rows = [];

            foreach ($variantsToUpdate as $variant) {
                $oldPrice = (float) ($variant->price ?? 0);
                $newPrice = round(max(0, $oldPrice * $multiplier), 8);
                $deltaPrice = round($newPrice - $oldPrice, 8);

                $variant->update(['price' => $newPrice]);

                $rows[] = [
                    'price_update_id' => $priceUpdate->id,
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'old_price' => $oldPrice,
                    'new_price' => $newPrice,
                    'delta_price' => $deltaPrice,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if ($rows !== []) {
                $priceUpdate->items()->insert($rows);
            }
        });

        return $this->renderPage(
            $filters,
            $this->resolvePreviewVariants($filters),
            [
                'applied' => true,
                'affected_variants_count' => $variantsToUpdate->count(),
                'change_value' => $changeValue,
            ],
        );
    }

    public function history(Request $request): Response
    {
        $history = PriceUpdate::query()
            ->with(['creator:id,name'])
            ->withCount('items')
            ->when(
                $request->search,
                fn (Builder $query, string $search) => $query->where('name', 'like', "%{$search}%")
            )
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/products/price-updates/history/index', [
            'history' => [
                'data' => collect($history->items())
                    ->map(fn (PriceUpdate $priceUpdate): array => [
                        'id' => $priceUpdate->id,
                        'name' => $priceUpdate->name,
                        'change_type' => $priceUpdate->change_type,
                        'change_value' => $priceUpdate->change_value,
                        'affected_variants_count' => $priceUpdate->affected_variants_count,
                        'items_count' => $priceUpdate->items_count,
                        'created_at' => $priceUpdate->created_at,
                        'creator_name' => $priceUpdate->creator?->name,
                    ])
                    ->all(),
                'meta' => [
                    'current_page' => $history->currentPage(),
                    'last_page' => $history->lastPage(),
                    'per_page' => $history->perPage(),
                    'total' => $history->total(),
                    'from' => $history->firstItem(),
                    'to' => $history->lastItem(),
                ],
            ],
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(PriceUpdate $priceUpdate): Response
    {
        $priceUpdate->load([
            'creator:id,name',
            'filters.attribute:id,name,code',
            'filters.attributeOption:id,label,value',
            'items.product:id,name,sku',
            'items.productVariant:id,sku',
        ]);

        return Inertia::render('inventory/products/price-updates/history/show', [
            'priceUpdate' => [
                'id' => $priceUpdate->id,
                'name' => $priceUpdate->name,
                'notes' => $priceUpdate->notes,
                'change_type' => $priceUpdate->change_type,
                'change_value' => $priceUpdate->change_value,
                'affected_variants_count' => $priceUpdate->affected_variants_count,
                'created_at' => $priceUpdate->created_at,
                'creator_name' => $priceUpdate->creator?->name,
                'filters' => $priceUpdate->filters
                    ->map(fn ($filter): array => [
                        'id' => $filter->id,
                        'entity_level' => $filter->entity_level,
                        'attribute' => [
                            'id' => $filter->attribute?->id,
                            'name' => $filter->attribute?->name,
                            'code' => $filter->attribute?->code,
                        ],
                        'attribute_option' => $filter->attributeOption ? [
                            'id' => $filter->attributeOption->id,
                            'label' => $filter->attributeOption->label,
                            'value' => $filter->attributeOption->value,
                        ] : null,
                    ])
                    ->values()
                    ->all(),
                'items' => $priceUpdate->items
                    ->map(fn ($item): array => [
                        'id' => $item->id,
                        'old_price' => $item->old_price,
                        'new_price' => $item->new_price,
                        'delta_price' => $item->delta_price,
                        'product' => [
                            'id' => $item->product?->id,
                            'name' => $item->product?->name,
                            'sku' => $item->product?->sku,
                        ],
                        'variant' => [
                            'id' => $item->productVariant?->id,
                            'sku' => $item->productVariant?->sku,
                        ],
                    ])
                    ->values()
                    ->all(),
            ],
        ]);
    }

    /**
     * @param  array<int, array{attribute_id:int, attribute_option_id:int|null}>  $filters
     * @param  array<int, array<string, mixed>>  $previewVariants
     * @param  array<string, mixed>|null  $execution
     */
    private function renderPage(array $filters, array $previewVariants, ?array $execution = null): Response
    {
        return Inertia::render('inventory/products/price-updates/index', [
            'attributes' => AttributeResource::collection($this->productLevelAttributes()),
            'filters' => $filters,
            'preview' => [
                'total_variants' => count($previewVariants),
                'variants' => $previewVariants,
            ],
            'execution' => $execution,
        ]);
    }

    /**
     * @return Collection<int, Attribute>
     */
    private function productLevelAttributes(): Collection
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
     * @param  array<int, array{attribute_id:int, attribute_option_id:int|null}>  $filters
     * @return array<int, array<string, mixed>>
     */
    private function resolvePreviewVariants(array $filters): array
    {
        return $this->buildCandidateVariantsQuery($filters)
            ->select(['id', 'product_id', 'sku', 'price', 'is_active'])
            ->with(['product:id,name,sku'])
            ->orderBy('product_id')
            ->orderBy('id')
            ->get()
            ->map(fn (ProductVariant $variant): array => [
                'id' => $variant->id,
                'product_id' => $variant->product_id,
                'product_name' => $variant->product?->name,
                'product_sku' => $variant->product?->sku,
                'sku' => $variant->sku,
                'price' => $variant->price,
                'is_active' => $variant->is_active,
            ])
            ->all();
    }

    /**
     * @param  array<int, array{attribute_id:int, attribute_option_id:int|null}>  $filters
     */
    private function buildCandidateVariantsQuery(array $filters): Builder
    {
        return ProductVariant::query()
            ->where('is_active', true)
            ->whereHas('product', function (Builder $productQuery) use ($filters): void {
                foreach ($filters as $filter) {
                    $productQuery->whereHas('attributeValues', function (Builder $attributeValueQuery) use ($filter): void {
                        $attributeValueQuery
                            ->whereNull('product_variant_id')
                            ->whereNull('product_serial_id')
                            ->where('attribute_id', $filter['attribute_id'])
                            ->when(
                                $filter['attribute_option_id'] !== null,
                                fn (Builder $optionQuery) => $optionQuery->where('attribute_option_id', $filter['attribute_option_id'])
                            );
                    });
                }
            });
    }

    /**
     * @param  array<int, array{attribute_id:int, attribute_option_id:int|null}>  $filters
     * @return array<int, array{attribute_id:int, attribute_option_id:int|null}>
     */
    private function normalizeFilters(array $filters): array
    {
        return collect($filters)
            ->map(fn (array $filter): array => [
                'attribute_id' => (int) $filter['attribute_id'],
                'attribute_option_id' => isset($filter['attribute_option_id']) && $filter['attribute_option_id'] !== ''
                    ? (int) $filter['attribute_option_id']
                    : null,
            ])
            ->values()
            ->all();
    }
}
