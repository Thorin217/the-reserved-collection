<?php

namespace App\Imports;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Import;
use App\Models\ImportError;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Row;
use Throwable;

class ProductsImport implements OnEachRow, SkipsEmptyRows, WithChunkReading, WithHeadingRow
{
    /** @var Collection<string, int>|null */
    private ?Collection $brandNameToId = null;

    /** @var Collection<string, int>|null */
    private ?Collection $categoryNameToId = null;

    public function __construct(private readonly Import $import) {}

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateRow(array $data): array
    {
        return Validator::make($data, [
            'product_sku' => ['required', 'string', 'max:100'],
            'product_name' => ['required', 'string', 'max:255'],
            'brand_name' => ['required_without:brand_id', 'string', 'max:255'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'category_name' => ['required_without:category_id', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'product_type' => ['nullable', Rule::in(['simple', 'variant', 'serializable'])],
            'track_stock' => ['nullable', 'boolean'],
            'has_serial_numbers' => ['nullable', 'boolean'],
            'status' => ['nullable', Rule::in(['draft', 'active', 'inactive'])],

            'variant_sku' => ['required', 'string', 'max:100'],
            'variant_cost' => ['nullable', 'numeric', 'min:0'],
            'variant_price' => ['nullable', 'numeric', 'min:0'],
            'variant_compare_price' => ['nullable', 'numeric', 'min:0'],
            'variant_barcode' => ['nullable', 'string', 'max:255'],
            'variant_weight' => ['nullable', 'numeric', 'min:0'],
            'variant_is_active' => ['nullable', 'boolean'],
        ])->validate();
    }

    public function onRow(Row $row): void
    {
        $rowNumber = $row->getIndex();
        /** @var array<string, mixed> $payload */
        $payload = collect($row->toArray())
            ->map(fn (mixed $value): mixed => is_string($value) ? trim($value) : $value)
            ->toArray();

        if ($this->isPayloadEmpty($payload)) {
            return;
        }

        $this->import->incrementProcessedRows();

        try {
            $data = $this->validateRow($payload);
            $brandId = $this->resolveBrandId($data);
            $categoryId = $this->resolveCategoryId($data);

            DB::transaction(function () use ($data, $brandId, $categoryId): void {
                $product = Product::query()->where('sku', $data['product_sku'])->first();

                if (! $product) {
                    $product = Product::query()->create([
                        'category_id' => $categoryId,
                        'brand_id' => $brandId,
                        'name' => (string) $data['product_name'],
                        'sku' => (string) $data['product_sku'],
                        'slug' => $this->generateUniqueSlug((string) $data['product_name']),
                        'description' => $data['description'] ?? null,
                        'product_type' => $data['product_type'] ?? 'variant',
                        'track_stock' => (bool) ($data['track_stock'] ?? true),
                        'has_serial_numbers' => (bool) ($data['has_serial_numbers'] ?? false),
                        'status' => $data['status'] ?? 'draft',
                    ]);
                } else {
                    $product->update([
                        'category_id' => $categoryId,
                        'brand_id' => $brandId,
                        'name' => (string) $data['product_name'],
                        'description' => $data['description'] ?? null,
                        'product_type' => $data['product_type'] ?? $product->product_type,
                        'track_stock' => (bool) ($data['track_stock'] ?? $product->track_stock),
                        'has_serial_numbers' => (bool) ($data['has_serial_numbers'] ?? $product->has_serial_numbers),
                        'status' => $data['status'] ?? $product->status,
                    ]);
                }

                $variant = ProductVariant::query()->where('sku', $data['variant_sku'])->first();

                if ($variant && $variant->product_id !== $product->id) {
                    throw new \RuntimeException('Variant SKU already exists for another product.');
                }

                ProductVariant::query()->updateOrCreate(
                    ['sku' => (string) $data['variant_sku']],
                    [
                        'product_id' => $product->id,
                        'barcode' => $data['variant_barcode'] ?? null,
                        'cost' => $data['variant_cost'] ?? null,
                        'price' => $data['variant_price'] ?? null,
                        'compare_price' => $data['variant_compare_price'] ?? null,
                        'weight' => $data['variant_weight'] ?? null,
                        'is_active' => (bool) ($data['variant_is_active'] ?? true),
                    ],
                );
            });

            $this->import->incrementSuccessfulRows();
        } catch (Throwable $throwable) {
            ImportError::query()->create([
                'import_id' => $this->import->id,
                'row_number' => $rowNumber,
                'attribute' => null,
                'value' => null,
                'error_code' => 'ROW_PROCESSING_ERROR',
                'message' => $this->resolveThrowableMessage($throwable),
                'payload' => $payload,
            ]);

            $this->import->incrementFailedRows();
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveBrandId(array $data): int
    {
        if (isset($data['brand_id']) && $data['brand_id'] !== null && $data['brand_id'] !== '') {
            return (int) $data['brand_id'];
        }

        $brandName = (string) ($data['brand_name'] ?? '');
        $normalizedName = $this->normalizeComparableText($brandName);
        $brandId = $this->brandNameMap()->get($normalizedName);

        if (! $brandId) {
            $suggestions = $this->closestNames($normalizedName, $this->brandNameMap()->keys());
            $suggestionsLabel = $suggestions === []
                ? ''
                : ' Did you mean: '.implode(', ', $suggestions).'?';

            throw new \RuntimeException('Brand not found by name: '.$brandName.'.'.$suggestionsLabel);
        }

        return $brandId;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveCategoryId(array $data): int
    {
        if (isset($data['category_id']) && $data['category_id'] !== null && $data['category_id'] !== '') {
            return (int) $data['category_id'];
        }

        $categoryName = (string) ($data['category_name'] ?? '');
        $normalizedName = $this->normalizeComparableText($categoryName);
        $categoryId = $this->categoryNameMap()->get($normalizedName);

        if (! $categoryId) {
            $suggestions = $this->closestNames($normalizedName, $this->categoryNameMap()->keys());
            $suggestionsLabel = $suggestions === []
                ? ''
                : ' Did you mean: '.implode(', ', $suggestions).'?';

            throw new \RuntimeException('Category not found by name: '.$categoryName.'.'.$suggestionsLabel);
        }

        return $categoryId;
    }

    /**
     * @return Collection<string, int>
     */
    private function brandNameMap(): Collection
    {
        if ($this->brandNameToId !== null) {
            return $this->brandNameToId;
        }

        $this->brandNameToId = Brand::query()
            ->get(['id', 'name'])
            ->mapWithKeys(fn (Brand $brand): array => [
                $this->normalizeComparableText((string) $brand->name) => (int) $brand->id,
            ]);

        return $this->brandNameToId;
    }

    /**
     * @return Collection<string, int>
     */
    private function categoryNameMap(): Collection
    {
        if ($this->categoryNameToId !== null) {
            return $this->categoryNameToId;
        }

        $this->categoryNameToId = Category::query()
            ->get(['id', 'name'])
            ->mapWithKeys(fn (Category $category): array => [
                $this->normalizeComparableText((string) $category->name) => (int) $category->id,
            ]);

        return $this->categoryNameToId;
    }

    private function normalizeComparableText(string $value): string
    {
        return (string) Str::of($value)
            ->ascii()
            ->lower()
            ->squish();
    }

    /**
     * @param  Collection<int, string>  $candidates
     * @return array<int, string>
     */
    private function closestNames(string $needle, Collection $candidates): array
    {
        if ($needle === '') {
            return [];
        }

        return $candidates
            ->map(fn (string $candidate): array => [
                'value' => $candidate,
                'distance' => levenshtein($needle, $candidate),
            ])
            ->sortBy('distance')
            ->take(3)
            ->pluck('value')
            ->values()
            ->all();
    }

    public function headingRow(): int
    {
        return 1;
    }

    public function chunkSize(): int
    {
        return 200;
    }

    private function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $candidate = $baseSlug;
        $suffix = 1;

        while (Product::query()->where('slug', $candidate)->exists()) {
            $candidate = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        return $candidate;
    }

    private function resolveThrowableMessage(Throwable $throwable): string
    {
        if ($throwable instanceof ValidationException) {
            $messages = collect($throwable->validator->errors()->all())
                ->map(fn (string $message): string => trim($message))
                ->filter()
                ->values()
                ->all();

            if ($messages !== []) {
                return implode('; ', $messages);
            }
        }

        return $throwable->getMessage();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function isPayloadEmpty(array $payload): bool
    {
        return collect($payload)->every(function (mixed $value): bool {
            if ($value === null) {
                return true;
            }

            if (is_string($value)) {
                return trim($value) === '';
            }

            return false;
        });
    }
}
