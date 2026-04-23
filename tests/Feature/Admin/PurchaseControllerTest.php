<?php

use App\Enums\PaymentStatus;
use App\Enums\PurchaseStatus;
use App\Models\AccountPayable;
use App\Models\Branch;
use App\Models\InventoryStock;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\User;
use App\Models\Warehouse;
use Inertia\Testing\AssertableInertia as Assert;

function makeWarehouse(): Warehouse
{
    $branch = Branch::create(['name' => 'Test Branch', 'is_active' => true]);

    return Warehouse::create([
        'branch_id' => $branch->id,
        'name' => 'Test Warehouse',
        'type' => 'main',
        'allows_sales' => true,
        'is_active' => true,
    ]);
}

beforeEach(function () {
    $this->user = User::factory()->admin()->create();
});

it('renders the purchases index page', function () {
    Purchase::factory()->count(3)->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->get('/admin/finance/purchases')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/purchases/index')
            ->has('purchases.data', 3)
            ->has('metrics')
        );
});

it('renders the create purchase page', function () {
    $this->actingAs($this->user)
        ->get('/admin/finance/purchases/create')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/purchases/create')
            ->has('vendors')
            ->has('warehouses')
            ->has('products')
        );
});

it('creates a draft purchase with items', function () {
    $this->actingAs($this->user)
        ->post('/admin/finance/purchases', [
            'vendor_name' => 'Proveedor Test',
            'items' => [
                [
                    'product_variant_id' => null,
                    'description' => 'Widget A',
                    'quantity' => 10,
                    'unit_cost' => 25.00,
                ],
            ],
        ])
        ->assertRedirect();

    $purchase = Purchase::where('vendor_name', 'Proveedor Test')->first();
    expect($purchase)->not->toBeNull()
        ->and($purchase->status)->toBe(PurchaseStatus::Draft)
        ->and((float) $purchase->subtotal)->toEqual(250.0)
        ->and((float) $purchase->total)->toEqual(250.0);

    expect(PurchaseItem::where('purchase_id', $purchase->id)->count())->toBe(1);
});

it('rejects a purchase without items', function () {
    $this->actingAs($this->user)
        ->post('/admin/finance/purchases', [
            'vendor_name' => 'Test Vendor',
            'items' => [],
        ])
        ->assertSessionHasErrors('items');

    expect(Purchase::count())->toBe(0);
});

it('renders the purchase show page', function () {
    $purchase = Purchase::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->get("/admin/finance/purchases/{$purchase->id}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/purchases/show')
            ->has('purchase.data.id')
        );
});

it('renders the purchase edit page for draft purchases', function () {
    $purchase = Purchase::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->get("/admin/finance/purchases/{$purchase->id}/edit")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('finance/purchases/edit')
        );
});

it('redirects confirmed purchases from edit to show', function () {
    $purchase = Purchase::factory()->confirmed()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->get("/admin/finance/purchases/{$purchase->id}/edit")
        ->assertRedirect("/admin/finance/purchases/{$purchase->id}");
});

it('confirms a purchase and creates inventory stock', function () {
    $warehouse = makeWarehouse();
    $variant = ProductVariant::factory()->create();
    $purchase = Purchase::factory()->create([
        'user_id' => $this->user->id,
        'warehouse_id' => $warehouse->id,
        'total' => 500.00,
        'subtotal' => 500.00,
    ]);

    PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_variant_id' => $variant->id,
        'description' => 'Test product',
        'quantity' => 5,
        'unit_cost' => 100.00,
        'line_total' => 500.00,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/purchases/{$purchase->id}/confirm")
        ->assertRedirect("/admin/finance/purchases/{$purchase->id}");

    $purchase->refresh();
    expect($purchase->status)->toBe(PurchaseStatus::Confirmed);

    $stock = InventoryStock::where('warehouse_id', $warehouse->id)
        ->where('product_variant_id', $variant->id)
        ->first();

    expect($stock)->not->toBeNull()
        ->and((float) $stock->quantity)->toEqual(5.0)
        ->and((float) $stock->available_quantity)->toEqual(5.0);
});

it('creates an account payable when confirming a purchase', function () {
    $warehouse = makeWarehouse();
    $purchase = Purchase::factory()->create([
        'user_id' => $this->user->id,
        'warehouse_id' => $warehouse->id,
        'vendor_name' => 'Vendor ABC',
        'total' => 1000.00,
        'subtotal' => 1000.00,
    ]);

    PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_variant_id' => null,
        'description' => 'Generic item',
        'quantity' => 1,
        'unit_cost' => 1000.00,
        'line_total' => 1000.00,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/purchases/{$purchase->id}/confirm")
        ->assertRedirect();

    $payable = AccountPayable::where('purchase_id', $purchase->id)->first();
    expect($payable)->not->toBeNull()
        ->and($payable->status)->toBe(PaymentStatus::Pending)
        ->and((float) $payable->amount)->toEqual(1000.0);
});

it('cannot confirm a purchase without a warehouse', function () {
    $purchase = Purchase::factory()->create([
        'user_id' => $this->user->id,
        'warehouse_id' => null,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/purchases/{$purchase->id}/confirm")
        ->assertSessionHasErrors('purchase');

    $purchase->refresh();
    expect($purchase->status)->toBe(PurchaseStatus::Draft);
});

it('cannot confirm a purchase without items', function () {
    $warehouse = makeWarehouse();
    $purchase = Purchase::factory()->create([
        'user_id' => $this->user->id,
        'warehouse_id' => $warehouse->id,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/purchases/{$purchase->id}/confirm")
        ->assertSessionHasErrors('purchase');

    $purchase->refresh();
    expect($purchase->status)->toBe(PurchaseStatus::Draft);
});

it('cancels a draft purchase', function () {
    $purchase = Purchase::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->post("/admin/finance/purchases/{$purchase->id}/cancel")
        ->assertRedirect();

    $purchase->refresh();
    expect($purchase->status)->toBe(PurchaseStatus::Cancelled);
});

it('cannot cancel a confirmed purchase', function () {
    $purchase = Purchase::factory()->confirmed()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->post("/admin/finance/purchases/{$purchase->id}/cancel")
        ->assertSessionHasErrors('purchase');

    $purchase->refresh();
    expect($purchase->status)->toBe(PurchaseStatus::Confirmed);
});

it('increments existing inventory stock on confirmation', function () {
    $warehouse = makeWarehouse();
    $variant = ProductVariant::factory()->create();

    InventoryStock::create([
        'warehouse_id' => $warehouse->id,
        'product_variant_id' => $variant->id,
        'quantity' => 10,
        'reserved_quantity' => 0,
        'available_quantity' => 10,
    ]);

    $purchase = Purchase::factory()->create([
        'user_id' => $this->user->id,
        'warehouse_id' => $warehouse->id,
        'total' => 300.00,
        'subtotal' => 300.00,
    ]);

    PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'product_variant_id' => $variant->id,
        'description' => 'Restock',
        'quantity' => 5,
        'unit_cost' => 60.00,
        'line_total' => 300.00,
    ]);

    $this->actingAs($this->user)
        ->post("/admin/finance/purchases/{$purchase->id}/confirm");

    $stock = InventoryStock::where('warehouse_id', $warehouse->id)
        ->where('product_variant_id', $variant->id)
        ->first();

    expect((float) $stock->quantity)->toEqual(15.0)
        ->and((float) $stock->available_quantity)->toEqual(15.0);
});
