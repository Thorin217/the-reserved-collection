<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Product;
use App\Models\ProductPriceHistory;
use App\Models\ProductVariant;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutMiddleware([
        HandleInertiaRequests::class,
    ]);
});

it('renders price history on the portal product page', function () {
    $product = Product::factory()->create();

    ProductVariant::factory()->create([
        'product_id' => $product->id,
        'price' => 2500,
        'is_active' => true,
    ]);

    ProductPriceHistory::query()->create([
        'product_id' => $product->id,
        'price' => 2400.00,
        'recorded_at' => '2026-02-01',
    ]);

    ProductPriceHistory::query()->create([
        'product_id' => $product->id,
        'price' => 2550.00,
        'recorded_at' => '2026-03-01',
    ]);

    ProductPriceHistory::query()->create([
        'product_id' => $product->id,
        'price' => 2650.00,
        'recorded_at' => '2026-04-01',
    ]);

    $this->get(route('portal.products.show', $product))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('portal/show')
            ->has('product.price_history', 3)
            ->where('product.price_history.0.recorded_at', '2026-02-01')
            ->where('product.price_history.1.recorded_at', '2026-03-01')
            ->where('product.price_history.2.recorded_at', '2026-04-01'));
});
