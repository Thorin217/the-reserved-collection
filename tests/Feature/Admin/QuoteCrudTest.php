<?php

use App\Models\Client;
use App\Models\Lead;
use App\Models\ProductVariant;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function quoteContext(): array
{
    $user = User::factory()->admin()->create();
    $client = Client::factory()->create();
    $lead = Lead::factory()->create([
        'client_id' => $client->id,
    ]);
    $variant = ProductVariant::factory()->create([
        'price' => 1250,
    ]);

    return compact('user', 'client', 'lead', 'variant');
}

function quotePayload(Client $client, Lead $lead, ProductVariant $variant, array $overrides = []): array
{
    return array_replace_recursive([
        'client_id' => $client->id,
        'lead_id' => $lead->id,
        'status' => 'draft',
        'currency' => 'USD',
        'issued_at' => now()->toDateString(),
        'expires_at' => now()->addDays(7)->toDateString(),
        'tax_total' => 50,
        'discount_total' => 25,
        'notes' => 'VIP client quote',
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'product_serial_id' => null,
                'description' => 'Primary line item',
                'quantity' => 2,
                'unit_price' => 1250,
                'notes' => 'First item note',
            ],
        ],
    ], $overrides);
}

it('renders the create and edit quote pages for admins', function () {
    ['user' => $user, 'client' => $client, 'lead' => $lead, 'variant' => $variant] = quoteContext();

    $quote = Quote::factory()->create([
        'client_id' => $client->id,
        'lead_id' => $lead->id,
        'user_id' => $user->id,
    ]);

    QuoteItem::factory()->create([
        'quote_id' => $quote->id,
        'product_variant_id' => $variant->id,
    ]);

    $this->actingAs($user)
        ->get(route('admin.finance.quotes.create'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('finance/quotes/create'));

    $this->actingAs($user)
        ->get(route('admin.finance.quotes.edit', $quote))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('finance/quotes/edit'));
});

it('creates quotes with calculated totals and items', function () {
    ['user' => $user, 'client' => $client, 'lead' => $lead, 'variant' => $variant] = quoteContext();

    $response = $this->actingAs($user)->post(
        route('admin.finance.quotes.store'),
        quotePayload($client, $lead, $variant),
    );

    $quote = Quote::query()->firstOrFail();

    $this->assertModelExists($quote);

    $response->assertRedirect(route('admin.finance.quotes.edit', $quote));

    expect($quote->quote_number)->toStartWith('Q-')
        ->and((float) $quote->subtotal)->toBe(2500.0)
        ->and((float) $quote->tax_total)->toBe(50.0)
        ->and((float) $quote->discount_total)->toBe(25.0)
        ->and((float) $quote->total)->toBe(2525.0)
        ->and($quote->items()->count())->toBe(1);
});

it('updates quotes and replaces their line items', function () {
    ['user' => $user, 'client' => $client, 'lead' => $lead, 'variant' => $variant] = quoteContext();

    $quote = Quote::factory()->create([
        'client_id' => $client->id,
        'lead_id' => $lead->id,
        'user_id' => $user->id,
        'status' => 'draft',
    ]);

    QuoteItem::factory()->create([
        'quote_id' => $quote->id,
        'product_variant_id' => $variant->id,
        'quantity' => 1,
        'unit_price' => 1000,
        'line_total' => 1000,
    ]);

    $secondVariant = ProductVariant::factory()->create([
        'price' => 500,
    ]);

    $response = $this->actingAs($user)->put(
        route('admin.finance.quotes.update', $quote),
        quotePayload($client, $lead, $variant, [
            'status' => 'sent',
            'tax_total' => 10,
            'discount_total' => 0,
            'items' => [
                [
                    'product_variant_id' => $secondVariant->id,
                    'product_serial_id' => null,
                    'description' => 'Updated item',
                    'quantity' => 3,
                    'unit_price' => 500,
                    'notes' => 'Updated note',
                ],
            ],
        ]),
    );

    $quote->refresh();

    $response->assertRedirect(route('admin.finance.quotes.edit', $quote));

    expect($quote->status->value)->toBe('sent')
        ->and((float) $quote->subtotal)->toBe(1500.0)
        ->and((float) $quote->total)->toBe(1510.0)
        ->and($quote->items()->count())->toBe(1)
        ->and($quote->items()->first()?->description)->toBe('Updated item');
});

it('deletes quotes when they have no related sales', function () {
    ['user' => $user, 'client' => $client, 'lead' => $lead, 'variant' => $variant] = quoteContext();

    $quote = Quote::factory()->create([
        'client_id' => $client->id,
        'lead_id' => $lead->id,
        'user_id' => $user->id,
    ]);

    QuoteItem::factory()->create([
        'quote_id' => $quote->id,
        'product_variant_id' => $variant->id,
    ]);

    $this->actingAs($user)
        ->delete(route('admin.finance.quotes.destroy', $quote))
        ->assertRedirect(route('admin.finance.quotes.index'));

    expect(Quote::query()->find($quote->id))->toBeNull();
});

it('forbids deleting quotes that already have related sales', function () {
    ['user' => $user, 'client' => $client, 'lead' => $lead] = quoteContext();

    $quote = Quote::factory()->create([
        'client_id' => $client->id,
        'lead_id' => $lead->id,
        'user_id' => $user->id,
    ]);

    Sale::factory()->create([
        'client_id' => $client->id,
        'lead_id' => $lead->id,
        'quote_id' => $quote->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->delete(route('admin.finance.quotes.destroy', $quote))
        ->assertForbidden();
});
