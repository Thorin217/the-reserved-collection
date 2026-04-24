<?php

use App\Enums\AuctionClosureResult;
use App\Enums\AuctionStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Auction;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutMiddleware([
        HandleInertiaRequests::class,
    ]);
});

it('renders the portal auction house and detail pages', function () {
    $product = Product::factory()->simple()->create([
        'name' => 'Royal Oak',
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'title' => 'Royal Oak Lot',
        'slug' => 'royal-oak-lot',
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Live,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    $this->get('/auction-house')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('portal/auction-house'));

    $this->get('/auctions/'.$auction->slug)
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/auctions/show')
            ->where('auction.data.slug', 'royal-oak-lot'));
});

it('shows participated auctions inside my auctions', function () {
    $customer = User::factory()->customer()->create();
    $otherCustomer = User::factory()->customer()->create();
    $product = Product::factory()->simple()->create([
        'name' => 'Nautilus',
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $participatedAuction = Auction::factory()->create([
        'title' => 'Nautilus Lot',
        'slug' => 'nautilus-lot',
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Closed,
        'closure_result' => AuctionClosureResult::Sold,
        'winner_user_id' => $otherCustomer->id,
        'hammer_price' => 22000,
        'starts_at' => now()->subDays(2),
        'ends_at' => now()->subDay(),
        'closed_at' => now()->subDay(),
    ]);

    $participatedAuction->bids()->create([
        'user_id' => $customer->id,
        'amount' => 20000,
        'placed_at' => now()->subDays(2),
        'is_winning' => false,
    ]);

    $this->actingAs($customer)
        ->get(route('portal.profile.auctions'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/auctions/my-bids')
            ->where('auctions.data.0.slug', 'nautilus-lot')
            ->where('auctions.data.0.user_has_bid', true)
            ->where('auctions.data.0.participation_result', 'lost'));
});

it('renders a dedicated my auction detail page for participated auctions', function () {
    $customer = User::factory()->customer()->create();
    $otherCustomer = User::factory()->customer()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'title' => 'Collector Lot',
        'slug' => 'collector-lot',
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Closed,
        'closure_result' => AuctionClosureResult::Sold,
        'winner_user_id' => $otherCustomer->id,
        'hammer_price' => 12000,
        'starts_at' => now()->subDays(2),
        'ends_at' => now()->subDay(),
        'closed_at' => now()->subDay(),
    ]);

    $auction->bids()->create([
        'user_id' => $customer->id,
        'amount' => 11000,
        'placed_at' => now()->subDays(2),
        'is_winning' => false,
    ]);

    $this->actingAs($customer)
        ->get(route('portal.profile.auctions.show', $auction))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/auctions/my-bid-show')
            ->where('auction.data.slug', 'collector-lot')
            ->where('auction.data.participation_result', 'lost'));
});

it('exposes a winning result for the participant in a closed auction', function () {
    $customer = User::factory()->customer()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Closed,
        'closure_result' => AuctionClosureResult::Sold,
        'winner_user_id' => $customer->id,
        'current_bid_user_id' => $customer->id,
        'current_bid_amount' => 18000,
        'hammer_price' => 18000,
        'starts_at' => now()->subDays(2),
        'ends_at' => now()->subDay(),
        'closed_at' => now()->subDay(),
    ]);

    $auction->bids()->create([
        'user_id' => $customer->id,
        'amount' => 18000,
        'placed_at' => now()->subDay(),
        'is_winning' => true,
    ]);

    $this->actingAs($customer)
        ->get('/auctions/'.$auction->slug)
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/auctions/show')
            ->where('auction.data.user_has_bid', true)
            ->where('auction.data.participation_result', 'won'));
});

it('allows a registered customer to place a valid bid', function () {
    $customer = User::factory()->customer()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'price' => 8000,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Live,
        'starting_price' => 8000,
        'minimum_increment' => 250,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
        'current_bid_amount' => null,
        'current_bid_user_id' => null,
    ]);

    $this->actingAs($customer)
        ->post("/auctions/{$auction->id}/bids", [
            'amount' => 8250,
        ])
        ->assertSessionHas('success');

    $auction->refresh();

    expect($auction->bids()->count())->toBe(1)
        ->and((float) $auction->current_bid_amount)->toBe(8250.0)
        ->and($auction->current_bid_user_id)->toBe($customer->id);
});

it('rejects bids that do not satisfy the minimum increment', function () {
    $customer = User::factory()->customer()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Live,
        'starting_price' => 1000,
        'minimum_increment' => 100,
        'current_bid_amount' => 1200,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    $this->actingAs($customer)
        ->post("/auctions/{$auction->id}/bids", [
            'amount' => 1250,
        ])
        ->assertSessionHasErrors('amount');
});

it('prevents the current leading bidder from bidding again immediately', function () {
    $customer = User::factory()->customer()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Live,
        'starting_price' => 1000,
        'minimum_increment' => 100,
        'current_bid_amount' => 1500,
        'current_bid_user_id' => $customer->id,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    $auction->bids()->create([
        'user_id' => $customer->id,
        'amount' => 1500,
        'placed_at' => now()->subSeconds(10),
        'is_winning' => true,
    ]);

    $this->actingAs($customer)
        ->post("/auctions/{$auction->id}/bids", [
            'amount' => 1600,
        ])
        ->assertSessionHasErrors('amount');
});

it('requires a 4 second cooldown before the same user can bid again', function () {
    $customer = User::factory()->customer()->create();
    $otherCustomer = User::factory()->customer()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Live,
        'starting_price' => 1000,
        'minimum_increment' => 100,
        'current_bid_amount' => 1600,
        'current_bid_user_id' => $otherCustomer->id,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    $auction->bids()->create([
        'user_id' => $customer->id,
        'amount' => 1500,
        'placed_at' => now()->subSeconds(2),
        'is_winning' => false,
    ]);

    $auction->bids()->create([
        'user_id' => $otherCustomer->id,
        'amount' => 1600,
        'placed_at' => now()->subSecond(),
        'is_winning' => true,
    ]);

    $this->actingAs($customer)
        ->post("/auctions/{$auction->id}/bids", [
            'amount' => 1700,
        ])
        ->assertSessionHasErrors('amount');
});

it('prevents admin users from bidding in auctions', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->simple()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $auction = Auction::factory()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => AuctionStatus::Live,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    $this->actingAs($admin)
        ->post("/auctions/{$auction->id}/bids", [
            'amount' => 5000,
        ])
        ->assertSessionHasErrors('amount');
});
