<?php

namespace App\Http\Requests\Admin;

use App\Models\AttributeOption;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProductPriceUpdatePreviewRequest extends FormRequest
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
            'filters' => ['required', 'array', 'min:1'],
            'filters.*.attribute_id' => ['required', 'integer', 'distinct', 'exists:attributes,id'],
            'filters.*.attribute_option_id' => ['nullable', 'integer', 'exists:attribute_options,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $filters = collect($this->input('filters', []));

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
