<?php

namespace App\Http\Requests\Admin;

use App\Enums\AttributeDataType;
use App\Enums\AttributeEntityLevel;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInlineAttributeRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (! $this->has('entity_levels') && $this->has('entity_level')) {
            $this->merge([
                'entity_levels' => [(string) $this->input('entity_level')],
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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:attributes,code'],
            'name' => ['required', 'string', 'max:255'],
            'entity_levels' => ['required', 'array', 'min:1'],
            'entity_levels.*' => ['required', 'distinct', Rule::enum(AttributeEntityLevel::class)],
            'data_type' => ['required', Rule::enum(AttributeDataType::class)],
            'unit' => ['nullable', 'string', 'max:20'],
            'is_filterable' => ['nullable', 'boolean'],
            'is_required' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'options' => ['sometimes', 'array'],
            'options.*.value' => ['required_with:options', 'string', 'max:255'],
            'options.*.label' => ['nullable', 'string', 'max:255'],
        ];
    }
}
