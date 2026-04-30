<?php

namespace App\Http\Requests\Admin;

use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\AuctionEvent;
use App\Models\AuctionItem;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAuctionEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'format' => ['required', Rule::enum(AuctionEventFormat::class)],
            'starts_at' => ['required', 'date', 'after_or_equal:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'notes' => ['nullable', 'string'],

            'items' => ['required_if:format,lot', 'array'],
            'items.*.product_variant_id' => ['required_if:format,lot', 'integer', 'exists:product_variants,id'],
            'items.*.product_serial_id' => ['nullable', 'integer', 'exists:product_serials,id'],
            'items.*.notes' => ['nullable', 'string'],
            'starting_price' => ['required_if:format,lot', 'numeric', 'min:0'],
            'reserve_price' => ['nullable', 'numeric'],
            'minimum_increment' => ['required_if:format,lot', 'numeric', 'gt:0'],

            'grouped_auctions' => ['required_if:format,grouped_items', 'array'],
            'grouped_auctions.*.title' => ['nullable', 'string', 'max:255'],
            'grouped_auctions.*.product_variant_id' => ['required_if:format,grouped_items', 'integer', 'exists:product_variants,id'],
            'grouped_auctions.*.product_serial_id' => ['nullable', 'integer', 'exists:product_serials,id'],
            'grouped_auctions.*.notes' => ['nullable', 'string'],
            'grouped_auctions.*.starting_price' => ['required_if:format,grouped_items', 'numeric', 'min:0'],
            'grouped_auctions.*.reserve_price' => ['nullable', 'numeric'],
            'grouped_auctions.*.minimum_increment' => ['required_if:format,grouped_items', 'numeric', 'gt:0'],
        ];
    }

    /**
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $format = $this->input('format');
                $currentAuction = $this->route('auction');
                $currentAuctionEvent = $this->route('auctionEvent');

                if ($currentAuction === null && $currentAuctionEvent instanceof AuctionEvent) {
                    $currentAuction = $currentAuctionEvent->auctions()->orderBy('sequence')->first();
                }

                $currentAuctionIds = collect();

                if ($currentAuction instanceof Auction) {
                    $currentAuctionIds = collect([$currentAuction->id]);
                } elseif ($currentAuctionEvent instanceof AuctionEvent) {
                    $currentAuctionIds = $currentAuctionEvent->auctions()->pluck('id');
                }

                if ($format === AuctionEventFormat::Lot->value) {
                    $items = $this->input('items', []);

                    if (count($items) < 1) {
                        $validator->errors()->add('items', 'Add at least one item to the lot.');
                    }

                    $this->validateInventoryUnits(
                        validator: $validator,
                        payloads: $items,
                        prefix: 'items',
                        currentAuctionIds: $currentAuctionIds->all(),
                        currentAuctionEvent: $currentAuctionEvent instanceof AuctionEvent ? $currentAuctionEvent : null,
                    );

                    if (
                        $this->filled('reserve_price')
                        && (float) $this->input('reserve_price') < (float) $this->input('starting_price')
                    ) {
                        $validator->errors()->add('reserve_price', 'The reserve price must be greater than or equal to the starting price.');
                    }
                }

                if ($format === AuctionEventFormat::GroupedItems->value) {
                    $groupedAuctions = $this->input('grouped_auctions', []);

                    if (count($groupedAuctions) < 1) {
                        $validator->errors()->add('grouped_auctions', 'Add at least one child auction.');
                    }

                    $this->validateInventoryUnits(
                        validator: $validator,
                        payloads: $groupedAuctions,
                        prefix: 'grouped_auctions',
                        currentAuctionIds: $currentAuctionIds->all(),
                        currentAuctionEvent: $currentAuctionEvent instanceof AuctionEvent ? $currentAuctionEvent : null,
                    );

                    foreach ($groupedAuctions as $index => $groupedAuction) {
                        if (
                            isset($groupedAuction['reserve_price'])
                            && $groupedAuction['reserve_price'] !== null
                            && $groupedAuction['reserve_price'] !== ''
                            && (float) $groupedAuction['reserve_price'] < (float) ($groupedAuction['starting_price'] ?? 0)
                        ) {
                            $validator->errors()->add(
                                "grouped_auctions.{$index}.reserve_price",
                                'The reserve price must be greater than or equal to the starting price.',
                            );
                        }
                    }
                }
            },
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $payloads
     * @param  array<int, int>  $currentAuctionIds
     */
    private function validateInventoryUnits(
        Validator $validator,
        array $payloads,
        string $prefix,
        array $currentAuctionIds,
        ?AuctionEvent $currentAuctionEvent = null,
    ): void {
        $selectedUnits = [];

        foreach ($payloads as $index => $itemPayload) {
            $variant = ProductVariant::query()
                ->with('product')
                ->find((int) ($itemPayload['product_variant_id'] ?? 0));

            if ($variant === null || $variant->product === null) {
                continue;
            }

            if (! $variant->is_active || $variant->product->status->value !== 'active') {
                $validator->errors()->add("{$prefix}.{$index}.product_variant_id", 'The selected inventory unit must be active.');
            }

            $serialId = (int) ($itemPayload['product_serial_id'] ?? 0);

            if ($variant->product->has_serial_numbers) {
                if ($serialId <= 0) {
                    $validator->errors()->add("{$prefix}.{$index}.product_serial_id", 'A serial is required for serializable products.');
                }
            } elseif ($serialId > 0) {
                $validator->errors()->add("{$prefix}.{$index}.product_serial_id", 'Only serializable products may include a serial.');
            }

            if ($serialId > 0) {
                $serial = ProductSerial::query()->find($serialId);

                if ($serial !== null && $serial->product_variant_id !== $variant->id) {
                    $validator->errors()->add("{$prefix}.{$index}.product_serial_id", 'The selected serial must belong to the selected variant.');
                }

                if ($serial !== null && $serial->status->value !== 'available') {
                    $validator->errors()->add("{$prefix}.{$index}.product_serial_id", 'The selected serial must be available.');
                }
            }

            $selectionKey = $variant->id.'-'.$serialId;

            if (in_array($selectionKey, $selectedUnits, true)) {
                $validator->errors()->add("{$prefix}.{$index}.product_variant_id", 'This inventory unit was already added to the event.');
            }

            $selectedUnits[] = $selectionKey;

            $existingAuctionItemQuery = AuctionItem::query()
                ->where('product_variant_id', $variant->id)
                ->whereHas('auction', function ($query) use ($currentAuctionEvent, $currentAuctionIds): void {
                    $query->whereIn('auctions.status', [
                        AuctionStatus::Draft->value,
                        AuctionStatus::Scheduled->value,
                        AuctionStatus::Live->value,
                    ]);

                    if ($currentAuctionEvent instanceof AuctionEvent) {
                        $query->where('auctions.auction_event_id', '!=', $currentAuctionEvent->id);

                        return;
                    }

                    if ($currentAuctionIds !== []) {
                        $query->whereNotIn('auctions.id', $currentAuctionIds);
                    }
                });

            if ($serialId > 0) {
                $existingAuctionItemQuery->where('product_serial_id', $serialId);
            } else {
                $existingAuctionItemQuery->whereNull('product_serial_id');
            }

            if ($existingAuctionItemQuery->exists()) {
                $validator->errors()->add("{$prefix}.{$index}.product_variant_id", 'The selected inventory unit already has an active auction.');
            }
        }
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

            $validated['grouped_auctions'] = collect($validated['grouped_auctions'] ?? [])
                ->map(fn (array $item) => [
                    'title' => $item['title'] ?? null,
                    'product_variant_id' => $item['product_variant_id'],
                    'product_serial_id' => $item['product_serial_id'] ?? null,
                    'notes' => $item['notes'] ?? null,
                    'starting_price' => $item['starting_price'],
                    'reserve_price' => $item['reserve_price'] ?? null,
                    'minimum_increment' => $item['minimum_increment'],
                ])
                ->values()
                ->all();
        }

        return $validated;
    }
}
