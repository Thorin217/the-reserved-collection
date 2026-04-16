<?php

use App\Models\Client;
use App\Models\Lead;
use App\Models\ProductVariant;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        VerifyCsrfToken::class,
        PreventRequestForgery::class,
    ]);
});

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
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/quotes/create')
            ->has('currencies', 1)
            ->where('currencies.0.value', 'USD'));

    $this->actingAs($user)
        ->get(route('admin.finance.quotes.edit', $quote))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/quotes/edit')
            ->has('currencies', 1)
            ->where('currencies.0.value', 'USD'));
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

it('converts a quote into a draft sale', function () {
    ['user' => $user, 'client' => $client, 'lead' => $lead, 'variant' => $variant] = quoteContext();

    $quote = Quote::factory()->create([
        'client_id' => $client->id,
        'lead_id' => $lead->id,
        'user_id' => $user->id,
        'tax_total' => 25,
        'discount_total' => 5,
        'total' => 2520,
    ]);

    QuoteItem::factory()->create([
        'quote_id' => $quote->id,
        'product_variant_id' => $variant->id,
        'description' => 'Quote line',
        'quantity' => 2,
        'unit_price' => 1250,
        'line_total' => 2500,
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.finance.quotes.convert-to-sale', $quote));

    $sale = Sale::query()->where('quote_id', $quote->id)->first();

    expect($sale)->not->toBeNull();

    $response->assertRedirect(route('admin.finance.sales.edit', $sale));

    expect($sale?->client_id)->toBe($quote->client_id)
        ->and($sale?->lead_id)->toBe($quote->lead_id)
        ->and($sale?->quote_id)->toBe($quote->id)
        ->and((float) ($sale?->tax_total ?? 0))->toBe(25.0)
        ->and((float) ($sale?->discount_total ?? 0))->toBe(5.0)
        ->and((float) ($sale?->balance_due ?? 0))->toBe(2520.0)
        ->and($sale?->items()->count())->toBe(1)
        ->and($sale?->items()->first()?->description)->toBe('Quote line');
});

it('redirects to existing sale when quote is already converted', function () {
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

    $sale = Sale::factory()->create([
        'client_id' => $client->id,
        'lead_id' => $lead->id,
        'quote_id' => $quote->id,
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.finance.quotes.convert-to-sale', $quote));

    $response->assertRedirect(route('admin.finance.sales.edit', $sale));

    expect(Sale::query()->where('quote_id', $quote->id)->count())->toBe(1);
});
