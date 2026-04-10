<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLeadProposalRequest extends FormRequest
{
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
            'title' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.product_serial_id' => ['nullable', 'integer', 'exists:product_serials,id'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.model' => ['nullable', 'string', 'max:255'],
            'items.*.suggested_price' => ['required', 'numeric', 'min:0'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
