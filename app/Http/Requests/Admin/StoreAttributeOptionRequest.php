<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttributeOptionRequest extends FormRequest
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
        $attribute = $this->route('attribute');
        $attributeId = is_object($attribute) ? $attribute->id : $attribute;

        return [
            'value' => [
                'required',
                'string',
                'max:255',
                Rule::unique('attribute_options', 'value')->where(fn ($query) => $query->where('attribute_id', $attributeId)),
            ],
            'label' => ['nullable', 'string', 'max:255'],
        ];
    }
}
