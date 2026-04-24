<?php

use App\Enums\AuctionClosureResult;
use App\Enums\AuctionStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Auction;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

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
        'product_variant_id' => $variant->id,
        'product_serial_id' => $serial?->id,
        'starting_price' => 15000,
        'reserve_price' => 15500,
        'minimum_increment' => 250,
        'starts_at' => now()->addHour()->format('Y-m-d H:i:s'),
        'ends_at' => now()->addDay()->format('Y-m-d H:i:s'),
        'notes' => 'VIP event',
    ], $overrides);
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
});

it('filters auctions in admin by closure result and inventory source type', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $matchingAuction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'inventory_source_type' => 'variant',
        'closure_result' => AuctionClosureResult::Sold,
        'status' => AuctionStatus::Closed,
    ]);

    Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'inventory_source_type' => 'serial',
        'closure_result' => AuctionClosureResult::ReserveNotMet,
        'status' => AuctionStatus::Closed,
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

it('creates an auction for a serial unit and snapshots inventory data', function () {
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

    $auction = Auction::query()->firstOrFail();

    $response->assertRedirect(route('admin.auctions.index'));

    expect($auction->status)->toBe(AuctionStatus::Draft)
        ->and($auction->product_variant_id)->toBe($variant->id)
        ->and($auction->product_serial_id)->toBe($serial->id)
        ->and($auction->inventory_snapshot['product_name'])->toBe('Submariner Date')
        ->and($auction->inventory_snapshot['serial_number'])->toBe('RLX-0001');
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
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
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

it('prevents creating a second active auction for the same inventory unit', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'product_serial_id' => null,
        'status' => AuctionStatus::Scheduled,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.store'), auctionAdminPayload($variant))
        ->assertSessionHasErrors('product_variant_id');
});

it('does not close a draft auction from admin', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
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
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
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
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'created_by' => $admin->id,
        'status' => AuctionStatus::Cancelled,
        'closed_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.auctions.cancel', $auction))
        ->assertSessionHas('error', 'This auction can not be cancelled anymore.');

    expect($auction->fresh()->status)->toBe(AuctionStatus::Cancelled);
});
