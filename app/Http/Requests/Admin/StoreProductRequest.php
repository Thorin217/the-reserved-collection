<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'description' => ['nullable', 'string'],
            'product_type' => ['required', 'in:simple,variant,serializable'],
            'track_stock' => ['boolean'],
            'has_serial_numbers' => ['boolean'],
            'status' => ['required', 'in:draft,active,inactive'],

            // Variante principal obligatoria
            'variant' => ['required', 'array'],
            'variant.sku' => ['required', 'string', 'max:100', 'unique:product_variants,sku'],
            'variant.cost' => ['nullable', 'numeric', 'min:0'],
            'variant.price' => ['nullable', 'numeric', 'min:0'],
            'variant.compare_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
