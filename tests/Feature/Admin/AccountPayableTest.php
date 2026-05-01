<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AccountPayable;
use App\Models\User;
use App\Models\Vendor;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->admin()->create();
    $this->withoutMiddleware([
        HandleInertiaRequests::class,
    ]);
});

it('renders the vendors index', function () {
    $this->actingAs($this->user)
        ->get('/admin/finance/vendors')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/vendors/index')
            ->has('vendors')
            ->has('metrics')
        );
});

it('creates a vendor', function () {
    $this->actingAs($this->user)
        ->post('/admin/finance/vendors', [
            'name' => 'Acme Supplies',
            'email' => 'billing@acme.com',
            'phone' => '+1 555 0000',
            'tax_id' => '123456789',
            'contact_person' => 'John Smith',
            'address' => '123 Main St',
            'notes' => null,
            'is_active' => true,
        ])
        ->assertRedirect();

    expect(Vendor::where('name', 'Acme Supplies')->exists())->toBeTrue();
});

it('renders the payable show page', function () {
    $payable = AccountPayable::factory()->create();

    $this->actingAs($this->user)
        ->get("/admin/finance/payables/{$payable->id}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/payables/show')
            ->has('payable.data')
            ->has('payment_methods')
        );
});

it('creates a payable linked to a vendor', function () {
    $vendor = Vendor::factory()->create();

    $this->actingAs($this->user)
        ->post('/admin/finance/payables', [
            'vendor_id' => $vendor->id,
            'reference' => 'INV-001',
            'amount' => 2500.00,
            'due_date' => now()->addDays(30)->toDateString(),
        ])
        ->assertRedirect(route('admin.finance.payables.index'));

    expect(AccountPayable::where('vendor_id', $vendor->id)->exists())->toBeTrue();
});

it('creates a payable with a free-text vendor name', function () {
    $this->actingAs($this->user)
        ->post('/admin/finance/payables', [
            'vendor_name' => 'Local Supplier',
            'amount' => 800.00,
        ])
        ->assertRedirect(route('admin.finance.payables.index'));

    expect(AccountPayable::where('vendor_name', 'Local Supplier')->exists())->toBeTrue();
});

it('creates a payable with initial paid_amount as partial', function () {
    $vendor = Vendor::factory()->create();

    $this->actingAs($this->user)
        ->post('/admin/finance/payables', [
            'vendor_id' => $vendor->id,
            'amount' => 1000.00,
            'paid_amount' => 400.00,
        ])
        ->assertRedirect(route('admin.finance.payables.index'));

    $payable = AccountPayable::where('vendor_id', $vendor->id)->first();
    expect($payable->paid_amount)->toEqual('400.00')
        ->and($payable->balance_due)->toEqual('600.00')
        ->and($payable->status)->toBe(PaymentStatus::Partial);
});

it('creates a payable with full paid_amount as paid', function () {
    $vendor = Vendor::factory()->create();

    $this->actingAs($this->user)
        ->post('/admin/finance/payables', [
            'vendor_id' => $vendor->id,
            'amount' => 500.00,
            'paid_amount' => 500.00,
        ])
        ->assertRedirect(route('admin.finance.payables.index'));

    $payable = AccountPayable::where('vendor_id', $vendor->id)->first();
    expect($payable->balance_due)->toEqual('0.00')
        ->and($payable->status)->toBe(PaymentStatus::Paid)
        ->and($payable->paid_at)->not->toBeNull();
});

it('records a payment and reduces payable balance', function () {
    $payable = AccountPayable::factory()->create([
        'amount' => 1000.00,
        'paid_amount' => 0,
        'balance_due' => 1000.00,
        'status' => PaymentStatus::Pending,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/payables/{$payable->id}/payments", [
            'amount' => 600.00,
            'payment_method' => PaymentMethod::BankTransfer->value,
            'payment_date' => now()->toDateString(),
            'reference' => 'TRF-002',
        ])
        ->assertRedirect("/admin/finance/payables/{$payable->id}");

    $payable->refresh();

    expect($payable->paid_amount)->toEqual('600.00')
        ->and($payable->balance_due)->toEqual('400.00')
        ->and($payable->status)->toBe(PaymentStatus::Partial)
        ->and($payable->payments()->count())->toBe(1);
});

it('marks payable as paid when balance reaches zero', function () {
    $payable = AccountPayable::factory()->create([
        'amount' => 500.00,
        'paid_amount' => 0,
        'balance_due' => 500.00,
        'status' => PaymentStatus::Pending,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/payables/{$payable->id}/payments", [
            'amount' => 500.00,
            'payment_method' => PaymentMethod::Cash->value,
            'payment_date' => now()->toDateString(),
        ])
        ->assertRedirect();

    $payable->refresh();

    expect($payable->balance_due)->toEqual('0.00')
        ->and($payable->status)->toBe(PaymentStatus::Paid)
        ->and($payable->paid_at)->not->toBeNull();
});

it('rejects a payment exceeding balance due', function () {
    $payable = AccountPayable::factory()->create([
        'amount' => 200.00,
        'balance_due' => 200.00,
        'status' => PaymentStatus::Pending,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/payables/{$payable->id}/payments", [
            'amount' => 999.00,
            'payment_method' => PaymentMethod::Cash->value,
            'payment_date' => now()->toDateString(),
        ])
        ->assertSessionHasErrors('amount');

    expect($payable->fresh()->payments()->count())->toBe(0);
});
