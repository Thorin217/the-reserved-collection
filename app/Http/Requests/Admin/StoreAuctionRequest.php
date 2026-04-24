<?php

namespace App\Http\Requests\Admin;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAuctionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'product_serial_id' => ['nullable', 'integer', 'exists:product_serials,id'],
            'starting_price' => ['required', 'numeric', 'min:0'],
            'reserve_price' => ['nullable', 'numeric', 'gte:starting_price'],
            'minimum_increment' => ['required', 'numeric', 'gt:0'],
            'starts_at' => ['required', 'date', 'after_or_equal:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $variant = ProductVariant::query()
                    ->with('product')
                    ->find($this->integer('product_variant_id'));

                if ($variant === null || $variant->product === null) {
                    return;
                }

                if (! $variant->is_active || $variant->product->status->value !== 'active') {
                    $validator->errors()->add('product_variant_id', 'The selected inventory unit must be active.');
                }

                $serialId = $this->integer('product_serial_id');

                if ($variant->product->has_serial_numbers) {
                    if ($serialId <= 0) {
                        $validator->errors()->add('product_serial_id', 'A serial is required for serializable products.');
                    }
                } elseif ($serialId > 0) {
                    $validator->errors()->add('product_serial_id', 'Only serializable products may include a serial.');
                }

                if ($serialId > 0) {
                    $serial = ProductSerial::query()->find($serialId);

                    if ($serial !== null && $serial->product_variant_id !== $variant->id) {
                        $validator->errors()->add('product_serial_id', 'The selected serial must belong to the selected variant.');
                    }

                    if ($serial !== null && $serial->status->value !== 'available') {
                        $validator->errors()->add('product_serial_id', 'The selected serial must be available.');
                    }
                }

                $existingAuctionQuery = Auction::query()
                    ->whereIn('status', [
                        AuctionStatus::Draft->value,
                        AuctionStatus::Scheduled->value,
                        AuctionStatus::Live->value,
                    ])
                    ->where('product_variant_id', $variant->id);

                if ($serialId > 0) {
                    $existingAuctionQuery->where('product_serial_id', $serialId);
                } else {
                    $existingAuctionQuery->whereNull('product_serial_id');
                }

                if ($existingAuctionQuery->exists()) {
                    $validator->errors()->add('product_variant_id', 'The selected inventory unit already has an active auction.');
                }
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): mixed
    {
        $validated = parent::validated($key, $default);

        if (is_array($validated)) {
            $validated['product_serial_id'] = $validated['product_serial_id'] ?? null;
        }

        return $validated;
    }
}
