<?php

use App\Actions\Finance\ConfirmSale;
use App\Models\AccountReceivable;
use App\Models\Branch;
use App\Models\Client;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\Warehouse;

it('confirms a sale and synchronizes inventory', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create();

    $branch = Branch::create([
        'name' => 'Main Branch',
    ]);

    $warehouse = Warehouse::create([
        'branch_id' => $branch->id,
        'name' => 'Showroom',
        'type' => 'display',
        'allows_sales' => true,
        'is_active' => true,
    ]);

    $variant = ProductVariant::factory()->create();

    $serial = ProductSerial::factory()->available()->create([
        'product_variant_id' => $variant->id,
        'warehouse_id' => $warehouse->id,
    ]);

    InventoryStock::create([
        'warehouse_id' => $warehouse->id,
        'product_variant_id' => $variant->id,
        'quantity' => 1,
        'reserved_quantity' => 0,
        'available_quantity' => 1,
        'average_cost' => 5000,
    ]);

    $sale = Sale::create([
        'client_id' => $client->id,
        'user_id' => $user->id,
        'warehouse_id' => $warehouse->id,
        'sale_number' => 'SALE-1001',
        'status' => 'draft',
        'currency' => 'USD',
        'subtotal' => 8000,
        'tax_total' => 0,
        'discount_total' => 0,
        'total' => 8000,
        'balance_due' => 8000,
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_variant_id' => $variant->id,
        'product_serial_id' => $serial->id,
        'description' => 'Luxury watch',
        'quantity' => 1,
        'unit_price' => 8000,
        'line_total' => 8000,
    ]);

    app(ConfirmSale::class)->handle($sale);

    $sale->refresh();
    $serial->refresh();

    $stock = InventoryStock::query()
        ->where('warehouse_id', $warehouse->id)
        ->where('product_variant_id', $variant->id)
        ->firstOrFail();

    expect($sale->status->value)->toBe('confirmed')
        ->and($serial->status->value)->toBe('sold')
        ->and((float) $stock->quantity)->toBe(0.0)
        ->and((float) $stock->available_quantity)->toBe(0.0)
        ->and(AccountReceivable::query()->where('sale_id', $sale->id)->exists())->toBeTrue()
        ->and(InventoryMovement::query()
            ->where('reference_type', Sale::class)
            ->where('reference_id', $sale->id)
            ->where('serial_id', $serial->id)
            ->exists())->toBeTrue();
});
