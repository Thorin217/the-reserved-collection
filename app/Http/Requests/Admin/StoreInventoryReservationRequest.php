<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryReservationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'reference_type' => ['nullable', 'string', 'max:255', 'required_with:reference_id'],
            'reference_id' => ['nullable', 'integer', 'required_with:reference_type'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
