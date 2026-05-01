<?php

use App\Enums\AuctionClosureResult;
use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Auction;
use App\Models\AuctionEvent;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutMiddleware([
        HandleInertiaRequests::class,
    ]);
});

function createPortalAuctionLot(array $auctionOverrides = []): Auction
{
    return Auction::factory()->create($auctionOverrides)->fresh(['items']);
}

function createPortalGroupedAuctionEvent(): AuctionEvent
{
    $event = AuctionEvent::factory()->create([
        'title' => 'Collector Set',
        'slug' => 'collector-set',
        'format' => AuctionEventFormat::GroupedItems,
        'status' => AuctionStatus::Live,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    Auction::factory()->create([
        'auction_event_id' => $event->id,
        'sequence' => 1,
        'title' => 'Patek Child',
        'slug' => 'patek-child',
        'status' => AuctionStatus::Live,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    Auction::factory()->create([
        'auction_event_id' => $event->id,
        'sequence' => 2,
        'title' => 'Rolex Child',
        'slug' => 'rolex-child',
        'status' => AuctionStatus::Live,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    return AuctionEvent::query()->with(['auctions.items'])->findOrFail($event->id);
}

it('renders the portal auction house and detail pages', function () {
    $auction = createPortalAuctionLot([
        'title' => 'Royal Oak Lot',
        'slug' => 'royal-oak-lot',
        'status' => AuctionStatus::Live,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    $this->get('/auction-house')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/auction-house')
            ->where('events.data.0.slug', 'royal-oak-lot')
            ->where('selected_event.data.slug', 'royal-oak-lot'));

    $this->get('/auctions/'.$auction->slug)
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/auctions/show')
            ->where('selected_event.data.slug', 'royal-oak-lot')
            ->where('selected_event.data.auctions.0.slug', 'royal-oak-lot')
            ->where('selected_auction_slug', 'royal-oak-lot'));
});

it('renders grouped item auction events in the portal auction house', function () {
    $event = createPortalGroupedAuctionEvent();

    $this->get(route('portal.auction-events.show', [
        'auctionEvent' => $event->slug,
    ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/auction-events/show')
            ->where('selected_event.data.slug', 'collector-set')
            ->where('selected_event.data.format', 'grouped_items'));

    $this->get(route('portal.auction-events.show', [
        'auctionEvent' => $event->slug,
        'auction' => 'rolex-child',
    ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/auction-events/show')
            ->where('selected_event.data.slug', 'collector-set')
            ->where('selected_event.data.format', 'grouped_items')
            ->where('selected_event.data.auctions.1.slug', 'rolex-child')
            ->where('selected_auction_slug', 'rolex-child'));
});

it('shows participated auctions inside my auctions', function () {
    $customer = User::factory()->customer()->create();
    $otherCustomer = User::factory()->customer()->create();

    $participatedAuction = createPortalAuctionLot([
        'title' => 'Nautilus Lot',
        'slug' => 'nautilus-lot',
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

    $auction = createPortalAuctionLot([
        'title' => 'Collector Lot',
        'slug' => 'collector-lot',
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

    $auction = createPortalAuctionLot([
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
            ->where('selected_event.data.auctions.0.user_has_bid', true)
            ->where('selected_event.data.auctions.0.participation_result', 'won')
            ->where('selected_auction_slug', $auction->slug));
});

it('allows a registered customer to place a valid bid', function () {
    $customer = User::factory()->customer()->create();

    $auction = createPortalAuctionLot([
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

    $auction = createPortalAuctionLot([
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

    $auction = createPortalAuctionLot([
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

    $auction = createPortalAuctionLot([
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

    $auction = createPortalAuctionLot([
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
