<?php

use App\Enums\AuctionClosureResult;
use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Auction;
use App\Models\AuctionEvent;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware([
        HandleInertiaRequests::class,
    ]);
});

function auctionAdminPayload(ProductVariant $variant, ?ProductSerial $serial = null, array $overrides = []): array
{
    return array_replace_recursive([
        'title' => 'Rolex Daytona Auction',
        'description' => 'Single lot auction',
        'format' => 'lot',
        'items' => [[
            'product_variant_id' => $variant->id,
            'product_serial_id' => $serial?->id,
            'notes' => '',
        ]],
        'starting_price' => 15000,
        'reserve_price' => 15500,
        'minimum_increment' => 250,
        'starts_at' => now()->addHour()->format('Y-m-d H:i:s'),
        'ends_at' => now()->addDay()->format('Y-m-d H:i:s'),
        'notes' => 'VIP event',
    ], $overrides);
}

function groupedAuctionEventPayload(ProductVariant $firstVariant, ProductVariant $secondVariant, array $overrides = []): array
{
    return array_replace_recursive([
        'title' => 'Spring Collector Drop',
        'description' => 'Grouped item auction event',
        'format' => 'grouped_items',
        'starts_at' => now()->addHour()->format('Y-m-d H:i:s'),
        'ends_at' => now()->addDay()->format('Y-m-d H:i:s'),
        'notes' => 'Grouped lots',
        'grouped_auctions' => [
            [
                'title' => 'Lot A',
                'product_variant_id' => $firstVariant->id,
                'product_serial_id' => null,
                'notes' => '',
                'starting_price' => 10000,
                'reserve_price' => 10500,
                'minimum_increment' => 100,
            ],
            [
                'title' => 'Lot B',
                'product_variant_id' => $secondVariant->id,
                'product_serial_id' => null,
                'notes' => '',
                'starting_price' => 12000,
                'reserve_price' => 12500,
                'minimum_increment' => 100,
            ],
        ],
    ], $overrides);
}

function createAuctionLot(array $auctionOverrides = [], array $itemOverrides = []): Auction
{
    $auction = Auction::factory()->create($auctionOverrides);
    $item = $auction->items()->firstOrFail();

    $item->update($itemOverrides);

    if ($itemOverrides !== []) {
        $auction->update([
            'inventory_source_type' => $item->inventory_source_type,
            'hero_image_url' => data_get($item->snapshot, 'image_url'),
            'inventory_snapshot' => $item->snapshot,
        ]);
    }

    return $auction->fresh(['items']);
}

it('renders auction admin index and create pages', function () {
    $admin = User::factory()->admin()->create();
    $simpleProduct = Product::factory()->simple()->create();
    ProductVariant::factory()->create([
        'product_id' => $simpleProduct->id,
    ]);

    $serialProduct = Product::factory()->create();
    $serialVariant = ProductVariant::factory()->create([
        'product_id' => $serialProduct->id,
    ]);
    ProductSerial::factory()->create([
        'product_variant_id' => $serialVariant->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.auctions.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('commercial/auctions/index'));

    $this->actingAs($admin)
        ->get(route('admin.auctions.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('commercial/auctions/create')
            ->has('variant_units')
            ->has('serial_units'));

    $this->actingAs($admin)
        ->get(route('admin.auction-events.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('commercial/auction-events/index'));
});

it('renders the edit page for a draft auction', function () {
    $admin = User::factory()->admin()->create();
    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.auctions.edit', $auction))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('commercial/auctions/edit')
            ->where('auction.data.id', $auction->id)
            ->has('variant_units')
            ->has('serial_units'));
});

it('renders the auction event show page', function () {
    $admin = User::factory()->admin()->create();
    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.auction-events.show', ['auctionEvent' => $auction->event->id]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('commercial/auction-events/show')
            ->where('event.data.id', $auction->event->id));
});

it('renders the auction event edit page for a draft lot event', function () {
    $admin = User::factory()->admin()->create();
    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.auction-events.edit', ['auctionEvent' => $auction->event->id]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('commercial/auction-events/edit')
            ->where('event.data.id', $auction->event->id)
            ->where('auction.data.id', $auction->id));
});

it('renders the auction event edit page for a draft grouped-items event', function () {
    $admin = User::factory()->admin()->create();
    $firstProduct = Product::factory()->simple()->create(['name' => 'First']);
    $secondProduct = Product::factory()->simple()->create(['name' => 'Second']);
    $firstVariant = ProductVariant::factory()->create(['product_id' => $firstProduct->id]);
    $secondVariant = ProductVariant::factory()->create(['product_id' => $secondProduct->id]);

    $this->actingAs($admin)
        ->post(route('admin.auction-events.store'), groupedAuctionEventPayload($firstVariant, $secondVariant))
        ->assertSessionHas('success');

    $event = AuctionEvent::query()->latest('id')->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.auction-events.edit', ['auctionEvent' => $event->id]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('commercial/auction-events/edit')
            ->where('event.data.id', $event->id));
});

it('renders the auction event create page', function () {
    $admin = User::factory()->admin()->create();
    $simpleProduct = Product::factory()->simple()->create();
    ProductVariant::factory()->create([
        'product_id' => $simpleProduct->id,
    ]);

    $serialProduct = Product::factory()->create();
    $serialVariant = ProductVariant::factory()->create([
        'product_id' => $serialProduct->id,
    ]);
    ProductSerial::factory()->create([
        'product_variant_id' => $serialVariant->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.auction-events.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('commercial/auction-events/create')
            ->has('variant_units')
            ->has('serial_units'));
});

it('filters auctions in admin by closure result and inventory source type', function () {
    $admin = User::factory()->admin()->create();

    $matchingAuction = createAuctionLot([
        'inventory_source_type' => 'variant',
        'closure_result' => AuctionClosureResult::Sold,
        'status' => AuctionStatus::Closed,
    ], [
        'inventory_source_type' => 'variant',
    ]);

    createAuctionLot([
        'inventory_source_type' => 'serial',
        'closure_result' => AuctionClosureResult::ReserveNotMet,
        'status' => AuctionStatus::Closed,
    ], [
        'inventory_source_type' => 'serial',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.auctions.index', [
            'closure_result' => AuctionClosureResult::Sold->value,
            'inventory_source_type' => 'variant',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('commercial/auctions/index')
            ->where('auctions.data', fn ($auctions) => count($auctions) === 1 && data_get($auctions, '0.id') === $matchingAuction->id)
            ->where('filters.closure_result', AuctionClosureResult::Sold->value)
            ->where('filters.inventory_source_type', 'variant'));
});

it('creates an auction lot for a serial unit and snapshots inventory data', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->create([
        'name' => 'Submariner Date',
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'price' => 18000,
    ]);
    $serial = ProductSerial::factory()->create([
        'product_variant_id' => $variant->id,
        'serial_number' => 'RLX-0001',
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.auctions.store'), auctionAdminPayload($variant, $serial));

    $auction = Auction::query()->with('items')->firstOrFail();
    $item = $auction->items->firstOrFail();

    $response->assertRedirect(route('admin.auctions.index'));

    expect($auction->status)->toBe(AuctionStatus::Draft)
        ->and($auction->auction_event_id)->not->toBeNull()
        ->and($auction->items)->toHaveCount(1)
        ->and($item->product_variant_id)->toBe($variant->id)
        ->and($item->product_serial_id)->toBe($serial->id)
        ->and($item->snapshot['product_name'])->toBe('Submariner Date')
        ->and($item->snapshot['serial_number'])->toBe('RLX-0001');
});

it('creates an auction event through the event admin flow', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->simple()->create([
        'name' => 'Royal Oak',
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'price' => 22000,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.auction-events.store'), auctionAdminPayload($variant));

    $auction = Auction::query()->with('event')->firstOrFail();

    $response->assertRedirect(route('admin.auction-events.show', ['auctionEvent' => $auction->event->id]));

    expect($auction->event)->not->toBeNull()
        ->and($auction->event->format->value)->toBe('lot')
        ->and($auction->event->title)->toBe('Rolex Daytona Auction');
});

it('creates a grouped-items auction event through the event admin flow', function () {
    $admin = User::factory()->admin()->create();
    $firstProduct = Product::factory()->simple()->create(['name' => 'Nautilus']);
    $secondProduct = Product::factory()->simple()->create(['name' => 'Royal Oak']);
    $firstVariant = ProductVariant::factory()->create(['product_id' => $firstProduct->id, 'price' => 10000]);
    $secondVariant = ProductVariant::factory()->create(['product_id' => $secondProduct->id, 'price' => 12000]);

    $response = $this->actingAs($admin)
        ->post(route('admin.auction-events.store'), groupedAuctionEventPayload($firstVariant, $secondVariant));

    $event = AuctionEvent::query()->latest('id')->firstOrFail();

    $response->assertRedirect(route('admin.auction-events.show', ['auctionEvent' => $event->id]));

    expect($event->format->value)->toBe('grouped_items')
        ->and($event->auctions()->count())->toBe(2)
        ->and($event->auctions()->pluck('sequence')->all())->toBe([1, 2]);
});

it('creates a grouped-items auction event with multiple serials from the same variant', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->create(['name' => 'Louis Vuitton Capucines MM Noir']);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'price' => 8450,
    ]);
    $firstSerial = ProductSerial::factory()->available()->create([
        'product_variant_id' => $variant->id,
    ]);
    $secondSerial = ProductSerial::factory()->available()->create([
        'product_variant_id' => $variant->id,
    ]);
    $thirdSerial = ProductSerial::factory()->available()->create([
        'product_variant_id' => $variant->id,
    ]);

    $payload = [
        'title' => 'Lote #2',
        'description' => 'Description',
        'format' => 'grouped_items',
        'starts_at' => now()->addHour()->format('Y-m-d H:i:s'),
        'ends_at' => now()->addHours(2)->format('Y-m-d H:i:s'),
        'notes' => 'Notes',
        'grouped_auctions' => [
            [
                'title' => 'Louis Vuitton Capucines MM Noir',
                'product_variant_id' => (string) $variant->id,
                'product_serial_id' => (string) $firstSerial->id,
                'notes' => '',
                'starting_price' => '8450',
                'reserve_price' => '8450',
                'minimum_increment' => '100',
            ],
            [
                'title' => 'Louis Vuitton Capucines MM Noir',
                'product_variant_id' => (string) $variant->id,
                'product_serial_id' => (string) $secondSerial->id,
                'notes' => '',
                'starting_price' => '8450',
                'reserve_price' => '8450',
                'minimum_increment' => '100',
            ],
            [
                'title' => 'Louis Vuitton Capucines MM Noir',
                'product_variant_id' => (string) $variant->id,
                'product_serial_id' => (string) $thirdSerial->id,
                'notes' => '',
                'starting_price' => '8450',
                'reserve_price' => '8450',
                'minimum_increment' => '100',
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post(route('admin.auction-events.store'), $payload);

    $event = AuctionEvent::query()->latest('id')->first();

    expect($response->isRedirect())->toBeTrue();

    if ($event === null) {
        $response->assertSessionHasErrors();

        return;
    }

    $response->assertRedirect(route('admin.auction-events.show', ['auctionEvent' => $event->id]));

    expect($event->format->value)->toBe('grouped_items')
        ->and($event->auctions()->count())->toBe(3);
});

it('creates an auction event automatically through the factory', function () {
    $auction = Auction::factory()->create();

    expect($auction->auction_event_id)->not->toBeNull()
        ->and($auction->event)->toBeInstanceOf(AuctionEvent::class)
        ->and($auction->event->slug)->toBe($auction->slug);
});

it('does not overwrite grouped auction event metadata when creating child auctions through the factory', function () {
    $admin = User::factory()->admin()->create();
    $event = AuctionEvent::factory()->create([
        'title' => 'Collector Event',
        'slug' => 'collector-event',
        'format' => AuctionEventFormat::GroupedItems,
        'created_by' => $admin->id,
    ]);

    Auction::factory()->create([
        'auction_event_id' => $event->id,
        'sequence' => 1,
        'title' => 'Child Auction A',
        'slug' => 'child-auction-a',
        'created_by' => $admin->id,
    ]);

    Auction::factory()->create([
        'auction_event_id' => $event->id,
        'sequence' => 2,
        'title' => 'Child Auction B',
        'slug' => 'child-auction-b',
        'created_by' => $admin->id,
    ]);

    $event->refresh();

    expect($event->title)->toBe('Collector Event')
        ->and($event->slug)->toBe('collector-event')
        ->and($event->auctions()->count())->toBe(2);
});

it('syncs the parent auction event status when the auction is published and cancelled', function () {
    $admin = User::factory()->admin()->create();
    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
        'starts_at' => now()->addHour(),
        'ends_at' => now()->addDay(),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.publish', $auction))
        ->assertSessionHas('success');

    expect($auction->fresh()->event->status)->toBe(AuctionStatus::Scheduled);

    $this->actingAs($admin)
        ->post(route('admin.auctions.cancel', $auction))
        ->assertSessionHas('success');

    expect($auction->fresh()->event->status)->toBe(AuctionStatus::Cancelled);
});

it('creates an auction lot with multiple items', function () {
    $admin = User::factory()->admin()->create();
    $firstProduct = Product::factory()->simple()->create(['name' => 'Nautilus']);
    $secondProduct = Product::factory()->simple()->create(['name' => 'Royal Oak']);
    $firstVariant = ProductVariant::factory()->create(['product_id' => $firstProduct->id]);
    $secondVariant = ProductVariant::factory()->create(['product_id' => $secondProduct->id]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.store'), auctionAdminPayload($firstVariant, null, [
            'title' => 'Dual Lot',
            'items' => [
                ['product_variant_id' => $firstVariant->id, 'product_serial_id' => null, 'notes' => ''],
                ['product_variant_id' => $secondVariant->id, 'product_serial_id' => null, 'notes' => ''],
            ],
        ]))
        ->assertRedirect(route('admin.auctions.index'));

    $auction = Auction::query()->with('items')->firstOrFail();

    expect($auction->items)->toHaveCount(2)
        ->and($auction->items->pluck('position')->all())->toBe([1, 2]);
});

it('updates a draft auction lot', function () {
    $admin = User::factory()->admin()->create();
    $firstProduct = Product::factory()->simple()->create(['name' => 'Nautilus']);
    $secondProduct = Product::factory()->simple()->create(['name' => 'Royal Oak']);
    $firstVariant = ProductVariant::factory()->create(['product_id' => $firstProduct->id, 'price' => 10000]);
    $secondVariant = ProductVariant::factory()->create(['product_id' => $secondProduct->id, 'price' => 12000]);

    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
        'title' => 'Original lot',
    ], [
        'product_id' => $firstProduct->id,
        'product_variant_id' => $firstVariant->id,
        'reference_price' => 10000,
        'snapshot' => [
            'product_name' => $firstProduct->name,
            'brand_name' => null,
            'attribute_summary' => null,
            'image_url' => null,
            'variant_sku' => $firstVariant->sku,
            'serial_number' => null,
            'price_reference' => 10000,
        ],
    ]);

    $this->actingAs($admin)
        ->put(route('admin.auctions.update', $auction), auctionAdminPayload($secondVariant, null, [
            'title' => 'Updated lot',
            'starting_price' => 12000,
            'reserve_price' => 12500,
            'items' => [
                ['product_variant_id' => $secondVariant->id, 'product_serial_id' => null, 'notes' => ''],
            ],
        ]))
        ->assertRedirect(route('admin.auctions.show', $auction))
        ->assertSessionHas('success', 'Auction updated successfully.');

    $auction->refresh()->load('items');

    expect($auction->title)->toBe('Updated lot')
        ->and((float) $auction->starting_price)->toBe(12000.0)
        ->and($auction->items)->toHaveCount(1)
        ->and($auction->items->first()->product_variant_id)->toBe($secondVariant->id);
});

it('updates a draft auction event through the event admin flow', function () {
    $admin = User::factory()->admin()->create();
    $firstProduct = Product::factory()->simple()->create(['name' => 'Nautilus']);
    $secondProduct = Product::factory()->simple()->create(['name' => 'Royal Oak']);
    $firstVariant = ProductVariant::factory()->create(['product_id' => $firstProduct->id, 'price' => 10000]);
    $secondVariant = ProductVariant::factory()->create(['product_id' => $secondProduct->id, 'price' => 12000]);

    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
        'title' => 'Original lot',
    ], [
        'product_id' => $firstProduct->id,
        'product_variant_id' => $firstVariant->id,
        'reference_price' => 10000,
        'snapshot' => [
            'product_name' => $firstProduct->name,
            'brand_name' => null,
            'attribute_summary' => null,
            'image_url' => null,
            'variant_sku' => $firstVariant->sku,
            'serial_number' => null,
            'price_reference' => 10000,
        ],
    ]);

    $this->actingAs($admin)
        ->put(route('admin.auction-events.update', ['auctionEvent' => $auction->event->id]), auctionAdminPayload($secondVariant, null, [
            'title' => 'Updated event lot',
            'starting_price' => 12000,
            'reserve_price' => 12500,
            'items' => [
                ['product_variant_id' => $secondVariant->id, 'product_serial_id' => null, 'notes' => ''],
            ],
        ]))
        ->assertRedirect(route('admin.auction-events.show', ['auctionEvent' => $auction->event->id]))
        ->assertSessionHas('success', 'Auction event updated successfully.');

    $auction->refresh()->load(['items', 'event']);

    expect($auction->title)->toBe('Updated event lot')
        ->and($auction->event->title)->toBe('Updated event lot')
        ->and($auction->items)->toHaveCount(1)
        ->and($auction->items->first()->product_variant_id)->toBe($secondVariant->id);
});

it('updates a draft grouped-items event through the event admin flow', function () {
    $admin = User::factory()->admin()->create();
    $firstProduct = Product::factory()->simple()->create(['name' => 'First']);
    $secondProduct = Product::factory()->simple()->create(['name' => 'Second']);
    $thirdProduct = Product::factory()->simple()->create(['name' => 'Third']);
    $firstVariant = ProductVariant::factory()->create(['product_id' => $firstProduct->id, 'price' => 10000]);
    $secondVariant = ProductVariant::factory()->create(['product_id' => $secondProduct->id, 'price' => 12000]);
    $thirdVariant = ProductVariant::factory()->create(['product_id' => $thirdProduct->id, 'price' => 15000]);

    $this->actingAs($admin)
        ->post(route('admin.auction-events.store'), groupedAuctionEventPayload($firstVariant, $secondVariant))
        ->assertSessionHas('success');

    $event = AuctionEvent::query()->latest('id')->firstOrFail();

    $response = $this->actingAs($admin)
        ->put(route('admin.auction-events.update', ['auctionEvent' => $event->id]), groupedAuctionEventPayload($secondVariant, $thirdVariant, [
            'title' => 'Updated Collector Drop',
            'grouped_auctions' => [
                [
                    'title' => 'Updated B',
                    'product_variant_id' => $secondVariant->id,
                    'product_serial_id' => null,
                    'notes' => '',
                    'starting_price' => 12000,
                    'reserve_price' => 12500,
                    'minimum_increment' => 150,
                ],
                [
                    'title' => 'Updated C',
                    'product_variant_id' => $thirdVariant->id,
                    'product_serial_id' => null,
                    'notes' => '',
                    'starting_price' => 15000,
                    'reserve_price' => 15800,
                    'minimum_increment' => 200,
                ],
            ],
        ]));

    $response
        ->assertStatus(302)
        ->assertSessionHas('success', 'Auction event updated successfully.');

    expect($response->headers->get('Location'))
        ->toBe(route('admin.auction-events.show', ['auctionEvent' => $event->id]));

    $event->refresh()->load('auctions.items');

    expect($event->title)->toBe('Updated Collector Drop')
        ->and($event->auctions)->toHaveCount(2)
        ->and($event->auctions->pluck('title')->all())->toBe(['Updated B', 'Updated C']);
});

it('rejects auctions with a start date in the past', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.store'), auctionAdminPayload($variant, null, [
            'starts_at' => now()->subMinute()->format('Y-m-d H:i:s'),
            'ends_at' => now()->addDay()->format('Y-m-d H:i:s'),
        ]))
        ->assertSessionHasErrors('starts_at');
});

it('rejects auctions whose end date is not after the start date', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $startsAt = now()->addHour()->format('Y-m-d H:i:s');

    $this->actingAs($admin)
        ->post(route('admin.auctions.store'), auctionAdminPayload($variant, null, [
            'starts_at' => $startsAt,
            'ends_at' => $startsAt,
        ]))
        ->assertSessionHasErrors('ends_at');
});

it('does not publish expired draft auctions', function () {
    $admin = User::factory()->admin()->create();

    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
        'starts_at' => now()->subDays(2),
        'ends_at' => now()->subDay(),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.publish', $auction))
        ->assertSessionHas('error', 'Expired auctions can not be published.');

    expect($auction->fresh()->status)->toBe(AuctionStatus::Draft);
});

it('does not allow editing a non-draft auction', function () {
    $admin = User::factory()->admin()->create();
    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Scheduled,
    ]);
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.auctions.edit', $auction))
        ->assertRedirect(route('admin.auctions.show', $auction))
        ->assertSessionHas('error', 'Only draft auctions can be edited.');

    $this->actingAs($admin)
        ->put(route('admin.auctions.update', $auction), auctionAdminPayload($variant, null, [
            'title' => 'Blocked update',
        ]))
        ->assertRedirect(route('admin.auctions.show', $auction))
        ->assertSessionHas('error', 'Only draft auctions can be edited.');
});

it('prevents creating a second active auction for the same inventory unit', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    createAuctionLot([
        'status' => AuctionStatus::Scheduled,
    ], [
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'product_serial_id' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.store'), auctionAdminPayload($variant))
        ->assertSessionHasErrors('items.0.product_variant_id');
});

it('does not close a draft auction from admin', function () {
    $admin = User::factory()->admin()->create();

    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.close', $auction))
        ->assertSessionHas('error', 'Only scheduled or live auctions can be closed.');

    expect($auction->fresh()->status)->toBe(AuctionStatus::Draft);
});

it('publishes and manually closes an auction with reserve met', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->customer()->create();

    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Draft,
        'reserve_price' => 1200,
        'starts_at' => now()->subMinute(),
        'ends_at' => now()->addHour(),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.publish', $auction))
        ->assertSessionHas('success');

    $auction->refresh();

    expect($auction->status)->toBe(AuctionStatus::Live);

    $auction->bids()->create([
        'user_id' => $customer->id,
        'amount' => 1500,
        'placed_at' => now(),
        'is_winning' => false,
    ]);

    $auction->update([
        'current_bid_amount' => 1500,
        'current_bid_user_id' => $customer->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.close', $auction))
        ->assertSessionHas('success');

    $auction->refresh();

    expect($auction->status)->toBe(AuctionStatus::Closed)
        ->and($auction->closure_result)->toBe(AuctionClosureResult::Sold)
        ->and((float) $auction->hammer_price)->toBe(1500.0)
        ->and($auction->winner_user_id)->toBe($customer->id);
});

it('does not cancel an already cancelled auction', function () {
    $admin = User::factory()->admin()->create();

    $auction = createAuctionLot([
        'created_by' => $admin->id,
        'status' => AuctionStatus::Cancelled,
        'closed_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.cancel', $auction))
        ->assertSessionHas('error', 'This auction can not be cancelled anymore.');

    expect($auction->fresh()->status)->toBe(AuctionStatus::Cancelled);
});
