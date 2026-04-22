<?php

use App\Enums\PaymentStatus;
use App\Models\AccountReceivable;
use App\Models\Client;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->admin()->create();
});

it('renders the create receivable page', function () {
    $this->actingAs($this->user)
        ->get('/admin/finance/receivables/create')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/receivables/create')
            ->has('clients')
        );
});

it('creates a receivable linked to a client', function () {
    $client = Client::factory()->create();

    $this->actingAs($this->user)
        ->post('/admin/finance/receivables', [
            'client_id' => $client->id,
            'reference' => 'INV-MANUAL-001',
            'amount' => 1500.00,
            'due_date' => now()->addDays(30)->toDateString(),
        ])
        ->assertRedirect();

    $receivable = AccountReceivable::where('client_id', $client->id)->first();
    expect($receivable)->not->toBeNull()
        ->and($receivable->status)->toBe(PaymentStatus::Pending)
        ->and($receivable->balance_due)->toEqual('1500.00')
        ->and($receivable->paid_amount)->toEqual('0.00');
});

it('rejects a receivable without a client', function () {
    $this->actingAs($this->user)
        ->post('/admin/finance/receivables', [
            'amount' => 500.00,
        ])
        ->assertSessionHasErrors('client_id');

    expect(AccountReceivable::count())->toBe(0);
});

it('rejects a receivable with a non-positive amount', function () {
    $client = Client::factory()->create();

    $this->actingAs($this->user)
        ->post('/admin/finance/receivables', [
            'client_id' => $client->id,
            'amount' => -100,
        ])
        ->assertSessionHasErrors('amount');
});

it('shows receivables on the client profile page', function () {
    $client = Client::factory()->create();
    AccountReceivable::factory()->create([
        'client_id' => $client->id,
        'amount' => 750.00,
        'balance_due' => 750.00,
        'status' => PaymentStatus::Pending,
    ]);

    $this->actingAs($this->user)
        ->get("/admin/clients/{$client->id}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('crm/clients/show')
            ->has('client.data.receivables', 1)
            ->has('client.data.receivables_balance')
        );
});
