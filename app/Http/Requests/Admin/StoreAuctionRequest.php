<?php

namespace App\Http\Requests\Admin;

use App\Enums\AuctionStatus;
use App\Models\AuctionItem;
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.product_serial_id' => ['nullable', 'integer', 'exists:product_serials,id'],
            'items.*.notes' => ['nullable', 'string'],
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
                $currentAuction = $this->route('auction');
                $currentAuctionId = $currentAuction instanceof Auction
                    ? $currentAuction->id
                    : (is_numeric($currentAuction) ? (int) $currentAuction : null);
                $selectedUnits = [];

                foreach ($this->input('items', []) as $index => $itemPayload) {
                    $variant = ProductVariant::query()
                        ->with('product')
                        ->find((int) ($itemPayload['product_variant_id'] ?? 0));

                    if ($variant === null || $variant->product === null) {
                        continue;
                    }

                    if (! $variant->is_active || $variant->product->status->value !== 'active') {
                        $validator->errors()->add("items.{$index}.product_variant_id", 'The selected inventory unit must be active.');
                    }

                    $serialId = (int) ($itemPayload['product_serial_id'] ?? 0);

                    if ($variant->product->has_serial_numbers) {
                        if ($serialId <= 0) {
                            $validator->errors()->add("items.{$index}.product_serial_id", 'A serial is required for serializable products.');
                        }
                    } elseif ($serialId > 0) {
                        $validator->errors()->add("items.{$index}.product_serial_id", 'Only serializable products may include a serial.');
                    }

                    if ($serialId > 0) {
                        $serial = ProductSerial::query()->find($serialId);

                        if ($serial !== null && $serial->product_variant_id !== $variant->id) {
                            $validator->errors()->add("items.{$index}.product_serial_id", 'The selected serial must belong to the selected variant.');
                        }

                        if ($serial !== null && $serial->status->value !== 'available') {
                            $validator->errors()->add("items.{$index}.product_serial_id", 'The selected serial must be available.');
                        }
                    }

                    $selectionKey = $variant->id.'-'.$serialId;

                    if (in_array($selectionKey, $selectedUnits, true)) {
                        $validator->errors()->add("items.{$index}.product_variant_id", 'This inventory unit was already added to the lot.');
                    }

                    $selectedUnits[] = $selectionKey;

                    $existingAuctionItemQuery = AuctionItem::query()
                        ->where('product_variant_id', $variant->id)
                        ->whereHas('auction', function ($query) use ($currentAuctionId): void {
                            $query
                                ->whereIn('status', [
                                    AuctionStatus::Draft->value,
                                    AuctionStatus::Scheduled->value,
                                    AuctionStatus::Live->value,
                                ])
                                ->when($currentAuctionId !== null, fn ($innerQuery) => $innerQuery->whereKeyNot($currentAuctionId));
                        });

                    if ($serialId > 0) {
                        $existingAuctionItemQuery->where('product_serial_id', $serialId);
                    } else {
                        $existingAuctionItemQuery->whereNull('product_serial_id');
                    }

                    if ($existingAuctionItemQuery->exists()) {
                        $validator->errors()->add("items.{$index}.product_variant_id", 'The selected inventory unit already has an active auction.');
                    }
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
            $validated['items'] = collect($validated['items'] ?? [])
                ->map(fn (array $item) => [
                    'product_variant_id' => $item['product_variant_id'],
                    'product_serial_id' => $item['product_serial_id'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ])
                ->values()
                ->all();
        }

        return $validated;
    }
}
