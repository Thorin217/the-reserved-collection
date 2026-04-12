<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductSerialRequest extends FormRequest
{
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
        return [
            'product_variant_id' => [
                'required',
                'integer',
                'exists:product_variants,id',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $productRouteParam = $this->route('product');
                    $product = $productRouteParam instanceof Product
                        ? $productRouteParam
                        : Product::query()->find((int) $productRouteParam);

                    if (! $product || ! $product->variants()->whereKey((int) $value)->exists()) {
                        $fail('La variante seleccionada no pertenece al producto.');
                    }
                },
            ],
            'serial_number' => ['required', 'string', 'max:255', 'unique:product_serials,serial_number'],
            'imei_or_reference' => ['nullable', 'string', 'max:255'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'status' => ['required', 'in:available,reserved,sold,returned,damaged,in_transit'],
            'attributes' => ['nullable', 'array'],
            'attributes.*.attribute_id' => ['required_with:attributes', 'integer', 'distinct', 'exists:attributes,id'],
            'attributes.*.attribute_option_id' => ['nullable', 'integer', 'exists:attribute_options,id'],
        ];
    }
}
