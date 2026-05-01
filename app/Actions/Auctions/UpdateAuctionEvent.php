<?php

namespace App\Actions\Auctions;

use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\AuctionEvent;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UpdateAuctionEvent
{
    public function __construct(
        private readonly SyncAuctionEventStatus $syncAuctionEventStatus,
        private readonly UpdateAuction $updateAuction,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(AuctionEvent $event, array $validated): AuctionEvent
    {
        return DB::transaction(function () use ($event, $validated): AuctionEvent {
            $event->loadMissing('auctions');

            if ($event->format === AuctionEventFormat::Lot) {
                /** @var Auction $auction */
                $auction = $event->auctions()->orderBy('sequence')->firstOrFail();

                $this->updateAuction->handle($auction, [
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'items' => $validated['items'],
                    'starting_price' => $validated['starting_price'],
                    'reserve_price' => $validated['reserve_price'] ?? null,
                    'minimum_increment' => $validated['minimum_increment'],
                    'starts_at' => $validated['starts_at'],
                    'ends_at' => $validated['ends_at'],
                    'notes' => $validated['notes'] ?? null,
                ]);

                $event->refresh();

                return $event->load([
                    'creator',
                    'closer',
                    'auctions.creator',
                    'auctions.winner',
                    'auctions.items.product.brand',
                    'auctions.items.product.category',
                    'auctions.items.productVariant',
                    'auctions.items.productSerial',
                ]);
            }

            $event->auctions()->each(function (Auction $auction): void {
                $auction->delete();
            });

            $event->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'starts_at' => $validated['starts_at'],
                'ends_at' => $validated['ends_at'],
                'notes' => $validated['notes'] ?? null,
                'hero_image_url' => null,
                'closed_by' => null,
                'closed_at' => null,
                'status' => AuctionStatus::Draft,
            ]);

            collect($validated['grouped_auctions'])
                ->values()
                ->each(function (array $groupedAuction, int $index) use ($event, $validated): void {
                    $itemPayload = $this->buildItemPayload(
                        $groupedAuction['product_variant_id'],
                        $groupedAuction['product_serial_id'] ?? null,
                        $groupedAuction['notes'] ?? null,
                        1,
                    );

                    $title = $groupedAuction['title']
                        ?: data_get($itemPayload, 'snapshot.product_name')
                        ?: sprintf('%s Item %d', $validated['title'], $index + 1);

                    $auction = Auction::query()->create([
                        'auction_event_id' => $event->id,
                        'sequence' => $index + 1,
                        'title' => $title,
                        'slug' => Str::slug($event->title.' '.$title).'-'.Str::lower(Str::random(6)),
                        'description' => $validated['description'] ?? null,
                        'status' => AuctionStatus::Draft,
                        'inventory_source_type' => $itemPayload['inventory_source_type'],
                        'lot_number' => 'LOT-TMP-'.Str::upper(Str::random(10)),
                        'hero_image_url' => data_get($itemPayload, 'snapshot.image_url'),
                        'starting_price' => $groupedAuction['starting_price'],
                        'reserve_price' => $groupedAuction['reserve_price'] ?? null,
                        'minimum_increment' => $groupedAuction['minimum_increment'],
                        'starts_at' => $validated['starts_at'],
                        'ends_at' => $validated['ends_at'],
                        'created_by' => $event->created_by,
                        'inventory_snapshot' => $itemPayload['snapshot'],
                        'notes' => $groupedAuction['notes'] ?? null,
                    ]);

                    $auction->items()->create($itemPayload);

                    $auction->update([
                        'lot_number' => 'LOT-'.str_pad((string) $auction->id, 6, '0', STR_PAD_LEFT),
                    ]);

                    if ($index === 0) {
                        $event->update([
                            'hero_image_url' => $auction->hero_image_url,
                        ]);
                    }
                });

            $this->syncAuctionEventStatus->handle($event);

            return $event->fresh([
                'creator',
                'closer',
                'auctions.creator',
                'auctions.winner',
                'auctions.items.product.brand',
                'auctions.items.product.category',
                'auctions.items.productVariant',
                'auctions.items.productSerial',
            ]);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function buildItemPayload(
        int $productVariantId,
        ?int $productSerialId,
        ?string $notes,
        int $position,
    ): array {
        $variant = ProductVariant::query()
            ->with(['product.brand', 'product.category'])
            ->findOrFail($productVariantId);

        $serial = $productSerialId !== null
            ? ProductSerial::query()->findOrFail($productSerialId)
            : null;

        return [
            'position' => $position,
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'product_serial_id' => $serial?->id,
            'inventory_source_type' => $serial ? 'serial' : $variant->product->product_type->value,
            'reference_price' => $variant->price,
            'snapshot' => $this->buildInventorySnapshot($variant, $serial),
            'notes' => $notes,
        ];
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
}
