<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use App\Models\ProductVariant;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (! $this->has('variants') && $this->has('variant')) {
            $this->merge([
                'variants' => [$this->input('variant')],
            ]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $productRouteParam = $this->route('product');
        $product = $productRouteParam instanceof Product
            ? $productRouteParam
            : Product::query()->findOrFail((int) $productRouteParam);

        $productId = $product->id;

        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', "unique:products,sku,{$productId}"],
            'description' => ['nullable', 'string'],
            'product_type' => ['required', 'in:simple,variant,serializable'],
            'track_stock' => ['boolean'],
            'has_serial_numbers' => ['boolean'],
            'status' => ['required', 'in:draft,active,inactive'],
            'image' => ['nullable', 'image', 'max:5120'],

            'attributes' => ['nullable', 'array'],
            'attributes.*.attribute_id' => ['required_with:attributes', 'integer', 'distinct', 'exists:attributes,id'],
            'attributes.*.value' => ['nullable'],
            'attributes.*.attribute_option_id' => ['nullable', 'integer', 'exists:attribute_options,id'],

            'variants' => ['sometimes', 'array', 'min:1'],
            'variants.*.id' => [
                'nullable',
                'integer',
                'exists:product_variants,id',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! $value) {
                        return;
                    }

                    $productRouteParam = $this->route('product');
                    $product = $productRouteParam instanceof Product
                        ? $productRouteParam
                        : Product::query()->find((int) $productRouteParam);

                    if (! $product || ! $product->variants()->whereKey((int) $value)->exists()) {
                        $fail('La variante seleccionada no pertenece a este producto.');
                    }
                },
            ],
            'variants.*.sku' => [
                'required_with:variants',
                'string',
                'max:100',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $index = (int) explode('.', $attribute)[1];
                    $variantId = (int) data_get($this->input('variants'), "{$index}.id", 0);

                    $query = ProductVariant::query()->where('sku', $value);

                    if ($variantId > 0) {
                        $query->where('id', '!=', $variantId);
                    }

                    if ($query->exists()) {
                        $fail('El SKU de la variante ya está en uso.');
                    }
                },
            ],
            'variants.*.cost' => ['nullable', 'numeric', 'min:0'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.compare_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.attributes' => ['nullable', 'array'],
            'variants.*.attributes.*.attribute_id' => ['required_with:variants.*.attributes', 'integer', 'distinct', 'exists:attributes,id'],
            'variants.*.attributes.*.attribute_option_id' => ['nullable', 'integer', 'exists:attribute_options,id'],
        ];
    }
}
