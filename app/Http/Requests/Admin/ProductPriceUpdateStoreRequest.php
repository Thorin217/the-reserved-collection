<?php

namespace App\Http\Requests\Admin;

use App\Models\AttributeOption;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProductPriceUpdateStoreRequest extends FormRequest
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
            'name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'change_type' => ['required', 'in:percentage'],
            'change_value' => ['required', 'numeric', 'gt:-100', 'lt:1000'],
            'filters' => ['required', 'array', 'min:1'],
            'filters.*.attribute_id' => ['required', 'integer', 'distinct', 'exists:attributes,id'],
            'filters.*.attribute_option_id' => ['nullable', 'integer', 'exists:attribute_options,id'],
            'variant_ids' => ['required', 'array', 'min:1'],
            'variant_ids.*' => ['required', 'integer', 'distinct', 'exists:product_variants,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $filters = collect($this->input('filters', []));
            $changeValue = (float) ($this->input('change_value') ?? 0);

            if (abs($changeValue) < 0.0000001) {
                $validator->errors()->add('change_value', 'The change value must be different from 0.');
            }

            $filters->each(function (array $filter, int $index) use ($validator): void {
                $attributeId = (int) ($filter['attribute_id'] ?? 0);
                $attributeOptionId = $filter['attribute_option_id'] ?? null;

                if ($attributeId <= 0 || $attributeOptionId === null || $attributeOptionId === '') {
                    return;
                }

                $belongsToAttribute = AttributeOption::query()
                    ->whereKey((int) $attributeOptionId)
                    ->where('attribute_id', $attributeId)
                    ->exists();

                if (! $belongsToAttribute) {
                    $validator->errors()->add(
                        "filters.{$index}.attribute_option_id",
                        'The selected option does not belong to the selected attribute.'
                    );
                }
            });
        });
    }
}
