<?php

namespace App\Actions\Auctions;

use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\AuctionEvent;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateAuction
{
    public function __construct(
        private readonly SyncAuctionEventStatus $syncAuctionEventStatus,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(array $validated, User $user): Auction
    {
        return DB::transaction(function () use ($validated, $user): Auction {
            $items = collect($validated['items'])
                ->values()
                ->map(function (array $item, int $index): array {
                    $variant = ProductVariant::query()
                        ->with(['product.brand', 'product.category'])
                        ->findOrFail($item['product_variant_id']);

                    $serial = isset($item['product_serial_id'])
                        ? ProductSerial::query()->findOrFail($item['product_serial_id'])
                        : null;

                    return [
                        'position' => $index + 1,
                        'product_id' => $variant->product_id,
                        'product_variant_id' => $variant->id,
                        'product_serial_id' => $serial?->id,
                        'inventory_source_type' => $serial ? 'serial' : $variant->product->product_type->value,
                        'reference_price' => $variant->price,
                        'snapshot' => $this->buildInventorySnapshot($variant, $serial),
                        'notes' => $item['notes'] ?? null,
                    ];
                });

            $primaryItem = $items->firstOrFail();
            $slug = Str::slug($validated['title']).'-'.Str::lower(Str::random(6));

            $event = AuctionEvent::query()->create([
                'title' => $validated['title'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'format' => AuctionEventFormat::Lot,
                'status' => AuctionStatus::Draft,
                'starts_at' => $validated['starts_at'],
                'ends_at' => $validated['ends_at'],
                'hero_image_url' => data_get($primaryItem, 'snapshot.image_url'),
                'notes' => $validated['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            $auction = Auction::query()->create([
                'auction_event_id' => $event->id,
                'sequence' => 1,
                'title' => $validated['title'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'status' => AuctionStatus::Draft,
                'inventory_source_type' => $this->resolveInventorySourceType($items->pluck('inventory_source_type')->all()),
                'lot_number' => 'LOT-TMP-'.Str::upper(Str::random(10)),
                'hero_image_url' => data_get($primaryItem, 'snapshot.image_url'),
                'starting_price' => $validated['starting_price'],
                'reserve_price' => $validated['reserve_price'] ?? null,
                'minimum_increment' => $validated['minimum_increment'],
                'starts_at' => $validated['starts_at'],
                'ends_at' => $validated['ends_at'],
                'created_by' => $user->id,
                'inventory_snapshot' => $primaryItem['snapshot'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $auction->items()->createMany($items->all());

            $auction->update([
                'lot_number' => 'LOT-'.str_pad((string) $auction->id, 6, '0', STR_PAD_LEFT),
            ]);

            $this->syncAuctionEventStatus->handle($event);

            return $auction->fresh([
                'items.product.brand',
                'items.product.category',
                'items.productVariant',
                'items.productSerial',
                'event',
                'creator',
            ]);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function buildInventorySnapshot(ProductVariant $variant, ?ProductSerial $serial): array
    {
        $product = $variant->product;

        return [
            'product_name' => $product->name,
            'product_slug' => $product->slug,
            'brand_name' => $product->brand?->name,
            'category_name' => $product->category?->name,
            'product_sku' => $product->sku,
            'variant_sku' => $variant->sku,
            'serial_number' => $serial?->serial_number,
            'image_url' => $product->getFirstMediaUrl('product'),
            'price_reference' => $variant->price,
            'product_type' => $product->product_type->value,
            'has_serial_numbers' => $product->has_serial_numbers,
            'attribute_summary' => $variant->attribute_summary,
        ];
    }

    /**
     * @param  array<int, string>  $sourceTypes
     */
    private function resolveInventorySourceType(array $sourceTypes): string
    {
        $uniqueSourceTypes = array_values(array_unique($sourceTypes));

        if (count($uniqueSourceTypes) === 1) {
            return $uniqueSourceTypes[0];
        }

        return 'mixed';
    }
}
