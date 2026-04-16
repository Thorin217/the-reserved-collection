<?php

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use App\Models\Warehouse;
use Inertia\Testing\AssertableInertia as Assert;

it('renders sales detail for admins', function () {
    $admin = User::factory()->admin()->create();

    $branch = Branch::query()->create([
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $warehouse = Warehouse::query()->create([
        'branch_id' => $branch->id,
        'name' => 'Main Warehouse',
        'type' => 'main',
        'allows_sales' => true,
        'is_active' => true,
    ]);

    $sale = Sale::factory()->create([
        'warehouse_id' => $warehouse->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.finance.sales.show', $sale))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/sales/show')
            ->where('sale.data.id', $sale->id)
            ->where('sale.data.warehouse.name', 'Main Warehouse')
            ->where('can.update', true));
});

it('allows admins to cancel draft sales', function () {
    $admin = User::factory()->admin()->create();

    $sale = Sale::factory()->create([
        'status' => 'draft',
    ]);

    $this->actingAs($admin)
        ->withSession(['_token' => 'cancel-token'])
        ->post(route('admin.finance.sales.cancel', $sale), ['_token' => 'cancel-token'])
        ->assertRedirect(route('admin.finance.sales.show', $sale));

    expect($sale->fresh()->status->value)->toBe('cancelled');
});

it('requires a warehouse before confirming draft sales', function () {
    $admin = User::factory()->admin()->create();

    $sale = Sale::factory()->create([
        'status' => 'draft',
        'warehouse_id' => null,
    ]);

    $this->actingAs($admin)
        ->withSession(['_token' => 'confirm-token'])
        ->post(route('admin.finance.sales.confirm', $sale), ['_token' => 'confirm-token'])
        ->assertSessionHasErrors('sale');
});
