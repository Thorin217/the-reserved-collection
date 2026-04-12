<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'image' => ['nullable', 'image', 'max:5120'],

            'attributes' => ['nullable', 'array'],
            'attributes.*.attribute_id' => ['required_with:attributes', 'integer', 'distinct', 'exists:attributes,id'],
            'attributes.*.value' => ['nullable'],
            'attributes.*.attribute_option_id' => ['nullable', 'integer', 'exists:attribute_options,id'],

            'variants' => ['required', 'array', 'min:1'],
            'variants.*.sku' => ['required', 'string', 'max:100', 'unique:product_variants,sku'],
            'variants.*.cost' => ['nullable', 'numeric', 'min:0'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.compare_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.attributes' => ['nullable', 'array'],
            'variants.*.attributes.*.attribute_id' => ['required_with:variants.*.attributes', 'integer', 'distinct', 'exists:attributes,id'],
            'variants.*.attributes.*.attribute_option_id' => ['nullable', 'integer', 'exists:attribute_options,id'],
        ];
    }
}
