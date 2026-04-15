<?php

namespace App\Http\Requests\Admin;

use App\Enums\QuoteStatus;
use App\Models\Lead;
use App\Models\ProductSerial;
use App\Models\Quote;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quote = $this->route('quote');

        return $quote instanceof Quote
            ? ($this->user()?->can('update', $quote) ?? false)
            : false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'lead_id' => ['nullable', 'integer', 'exists:leads,id'],
            'status' => ['required', Rule::enum(QuoteStatus::class)],
            'currency' => ['required', 'string', Rule::in(['USD', 'GTQ'])],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'tax_total' => ['nullable', 'numeric', 'min:0'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.product_serial_id' => ['nullable', 'integer', 'exists:product_serials,id'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $leadId = $this->integer('lead_id');

                if ($leadId > 0) {
                    $lead = Lead::query()->find($leadId);

                    if ($lead && $lead->client_id !== $this->integer('client_id')) {
                        $validator->errors()->add('lead_id', 'The selected lead must belong to the selected client.');
                    }
                }

                foreach ($this->input('items', []) as $index => $item) {
                    $serialId = (int) ($item['product_serial_id'] ?? 0);
                    $variantId = (int) ($item['product_variant_id'] ?? 0);

                    if ($serialId <= 0) {
                        continue;
                    }

                    $serial = ProductSerial::query()->find($serialId);

                    if ($serial && $serial->product_variant_id !== $variantId) {
                        $validator->errors()->add("items.{$index}.product_serial_id", 'The selected serial must belong to the selected variant.');
                    }
                }
            },
        ];
    }
}
