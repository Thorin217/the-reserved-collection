<?php

use App\Models\CartItem;
use App\Models\Client;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\User;

it('creates a draft order from cart checkout and clears the cart', function () {
    $user = User::factory()->customer()->create();

    Client::factory()->create([
        'user_id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
    ]);

    $variant = ProductVariant::factory()->create([
        'price' => 3500,
    ]);

    CartItem::query()->create([
        'user_id' => $user->id,
        'product_variant_id' => $variant->id,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)
        ->withSession(['_token' => 'checkout-token'])
        ->post(route('portal.cart.checkout'), ['_token' => 'checkout-token']);

    $sale = Sale::query()->firstOrFail();

    $response->assertRedirect(route('portal.orders.show', $sale));

    expect($sale->status->value)->toBe('draft')
        ->and((float) $sale->subtotal)->toBe(7000.0)
        ->and((float) $sale->total)->toBe(7000.0)
        ->and((float) $sale->balance_due)->toBe(7000.0)
        ->and($sale->items()->count())->toBe(1)
        ->and(CartItem::query()->where('user_id', $user->id)->exists())->toBeFalse();
});

it('only allows viewing orders that belong to the authenticated client', function () {
    $owner = User::factory()->customer()->create();
    $viewer = User::factory()->customer()->create();

    $client = Client::factory()->create([
        'user_id' => $owner->id,
    ]);

    Client::factory()->create([
        'user_id' => $viewer->id,
    ]);

    $sale = Sale::factory()->create([
        'client_id' => $client->id,
        'user_id' => $owner->id,
    ]);

    $this->actingAs($viewer)
        ->get(route('portal.orders.show', $sale))
        ->assertForbidden();
});
