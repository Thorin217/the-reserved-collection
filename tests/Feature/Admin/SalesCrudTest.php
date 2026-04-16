<?php

use App\Models\Client;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function salePayload(Client $client, ProductVariant $variant, array $overrides = []): array
{
    return array_replace_recursive([
        'client_id' => $client->id,
        'warehouse_id' => null,
        'status' => 'draft',
        'sold_at' => null,
        'tax_total' => 25,
        'discount_total' => 0,
        'balance_due' => 2025,
        'notes' => 'Manual admin sale',
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'description' => 'Manual line',
                'quantity' => 2,
                'unit_price' => 1000,
            ],
        ],
    ], $overrides);
}

it('renders create and edit sales pages for admins', function () {
    $admin = User::factory()->admin()->create();
    $sale = Sale::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.finance.sales.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('finance/sales/create'));

    $this->actingAs($admin)
        ->get(route('admin.finance.sales.edit', $sale))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('finance/sales/edit'));
});

it('creates draft sales from admin form', function () {
    $admin = User::factory()->admin()->create();
    $client = Client::factory()->create();
    $variant = ProductVariant::factory()->create([
        'price' => 1000,
    ]);

    $response = $this->actingAs($admin)
        ->withSession(['_token' => 'store-sale-token'])
        ->post(route('admin.finance.sales.store'), [
            ...salePayload($client, $variant),
            '_token' => 'store-sale-token',
        ]);

    $sale = Sale::query()->firstOrFail();

    $response->assertRedirect(route('admin.finance.sales.edit', $sale));

    expect($sale->status->value)->toBe('draft')
        ->and((float) $sale->subtotal)->toBe(2000.0)
        ->and((float) $sale->total)->toBe(2025.0)
        ->and($sale->items()->count())->toBe(1);
});
