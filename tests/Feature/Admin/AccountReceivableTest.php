<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AccountReceivable;
use App\Models\Client;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->admin()->create();
    $this->withoutMiddleware([
        HandleInertiaRequests::class,
    ]);
});

it('renders the receivable show page', function () {
    $receivable = AccountReceivable::factory()->create();

    $this->actingAs($this->user)
        ->get("/admin/finance/receivables/{$receivable->id}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/receivables/show')
            ->has('receivable.data')
            ->has('payment_methods')
        );
});

it('creates a receivable and redirects back to the index', function () {
    $client = Client::factory()->create();

    $this->actingAs($this->user)
        ->post('/admin/finance/receivables', [
            'client_id' => $client->id,
            'reference' => 'REC-001',
            'amount' => 1200.00,
            'due_date' => now()->addDays(15)->toDateString(),
            'notes' => 'Manual receivable',
        ])
        ->assertRedirect(route('admin.finance.receivables.index'));

    expect(AccountReceivable::query()->where('reference', 'REC-001')->exists())->toBeTrue();
});

it('records a payment against a receivable', function () {
    $receivable = AccountReceivable::factory()->create([
        'amount' => 1000.00,
        'paid_amount' => 0,
        'balance_due' => 1000.00,
        'status' => PaymentStatus::Pending,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/receivables/{$receivable->id}/payments", [
            'amount' => 400.00,
            'payment_method' => PaymentMethod::BankTransfer->value,
            'payment_date' => now()->toDateString(),
            'reference' => 'TRF-001',
            'notes' => null,
        ])
        ->assertRedirect("/admin/finance/receivables/{$receivable->id}");

    $receivable->refresh();

    expect($receivable->paid_amount)->toEqual('400.00')
        ->and($receivable->balance_due)->toEqual('600.00')
        ->and($receivable->status)->toBe(PaymentStatus::Partial)
        ->and($receivable->payments()->count())->toBe(1);
});

it('marks the receivable as paid when balance reaches zero', function () {
    $receivable = AccountReceivable::factory()->create([
        'amount' => 500.00,
        'paid_amount' => 0,
        'balance_due' => 500.00,
        'status' => PaymentStatus::Pending,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/receivables/{$receivable->id}/payments", [
            'amount' => 500.00,
            'payment_method' => PaymentMethod::Cash->value,
            'payment_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    $receivable->refresh();

    expect($receivable->balance_due)->toEqual('0.00')
        ->and($receivable->status)->toBe(PaymentStatus::Paid)
        ->and($receivable->paid_at)->not->toBeNull();
});

it('rejects a payment that exceeds the balance due', function () {
    $receivable = AccountReceivable::factory()->create([
        'amount' => 300.00,
        'paid_amount' => 0,
        'balance_due' => 300.00,
        'status' => PaymentStatus::Pending,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/receivables/{$receivable->id}/payments", [
            'amount' => 500.00,
            'payment_method' => PaymentMethod::Cash->value,
            'payment_date' => now()->toDateString(),
        ])
        ->assertSessionHasErrors('amount');

    expect($receivable->fresh()->payments()->count())->toBe(0);
});

it('validates required fields for payment recording', function () {
    $receivable = AccountReceivable::factory()->create();

    $this->actingAs($this->user)
        ->post("/admin/finance/receivables/{$receivable->id}/payments", [])
        ->assertSessionHasErrors(['amount', 'payment_method', 'payment_date']);
});
