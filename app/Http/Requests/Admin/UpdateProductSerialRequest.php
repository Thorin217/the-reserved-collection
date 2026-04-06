<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductSerialRequest extends FormRequest
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
        $serialId = $this->route('serial')->id;

        return [
            'imei_or_reference' => ['nullable', 'string', 'max:255'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'status' => ['required', 'in:available,reserved,sold,returned,damaged,in_transit'],
            'serial_number' => ['required', 'string', 'max:255', "unique:product_serials,serial_number,{$serialId}"],
        ];
    }
}
