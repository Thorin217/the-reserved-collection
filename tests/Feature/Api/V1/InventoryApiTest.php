<?php

use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());

    $this->brand = Brand::factory()->create();
    $this->category = Category::factory()->create();
});

it('lists inventory products with stock summary and includes', function () {
    $branch = Branch::query()->create([
        'name' => 'Main Branch',
        'phone' => '555-1000',
        'email' => 'branch@example.com',
        'address' => '123 Main St',
        'city' => 'San Salvador',
        'state' => 'San Salvador',
        'country' => 'SV',
        'is_active' => true,
    ]);

    $warehouse = Warehouse::query()->create([
        'branch_id' => $branch->id,
        'name' => 'Main Warehouse',
        'type' => 'main',
        'allows_sales' => true,
        'description' => 'Primary warehouse',
        'is_active' => true,
        'is_default' => true,
    ]);

    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
        'name' => 'Rolex Submariner',
        'sku' => 'ROL-SUB-001',
    ]);

    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'sku' => 'ROL-SUB-001-VAR',
    ]);

    InventoryStock::query()->create([
        'warehouse_id' => $warehouse->id,
        'product_variant_id' => $variant->id,
        'quantity' => 3,
        'reserved_quantity' => 1,
        'available_quantity' => 2,
        'average_cost' => 10000,
    ]);

    $this->getJson('/api/v1/inventory/products?has_stock=1&include=variants,stocks&per_page=10')
        ->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Inventory products retrieved successfully.')
        ->assertJsonPath('data.data.0.name', 'Rolex Submariner')
        ->assertJsonPath('data.data.0.stock_summary.total_quantity', 3)
        ->assertJsonPath('data.data.0.stock_summary.available_quantity', 2)
        ->assertJsonPath('data.data.0.stocks.0.warehouse_name', 'Main Warehouse')
        ->assertJsonPath('data.data.0.variants.0.sku', 'ROL-SUB-001-VAR');
});

it('creates a product with variants through the inventory api', function () {
    $payload = [
        'category_id' => $this->category->id,
        'brand_id' => $this->brand->id,
        'name' => 'Rolex Daytona',
        'sku' => 'ROL-DAY-001',
        'description' => 'Luxury chronograph',
        'product_type' => 'serializable',
        'track_stock' => true,
        'has_serial_numbers' => true,
        'status' => 'active',
        'attributes' => [],
        'variants' => [
            [
                'sku' => 'ROL-DAY-001-VAR',
                'cost' => 15000,
                'price' => 22000,
                'compare_price' => 23000,
                'attributes' => [],
            ],
        ],
    ];

    $this->postJson('/api/v1/inventory/products', $payload)
        ->assertCreated()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Product created successfully.')
        ->assertJsonPath('data.name', 'Rolex Daytona')
        ->assertJsonPath('data.variants.0.sku', 'ROL-DAY-001-VAR');

    $this->assertDatabaseHas('products', [
        'sku' => 'ROL-DAY-001',
        'name' => 'Rolex Daytona',
    ]);

    $this->assertDatabaseHas('product_variants', [
        'sku' => 'ROL-DAY-001-VAR',
    ]);
});

it('creates a serial and updates inventory stock through the inventory api', function () {
    $branch = Branch::query()->create([
        'name' => 'Main Branch',
        'phone' => '555-1000',
        'email' => 'branch@example.com',
        'address' => '123 Main St',
        'city' => 'San Salvador',
        'state' => 'San Salvador',
        'country' => 'SV',
        'is_active' => true,
    ]);

    $warehouse = Warehouse::query()->create([
        'branch_id' => $branch->id,
        'name' => 'Main Warehouse',
        'type' => 'main',
        'allows_sales' => true,
        'description' => 'Primary warehouse',
        'is_active' => true,
        'is_default' => true,
    ]);

    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
    ]);

    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $this->postJson("/api/v1/inventory/products/{$product->id}/serials", [
        'product_variant_id' => $variant->id,
        'serial_number' => 'SERIAL-0001',
        'imei_or_reference' => 'REF-0001',
        'warehouse_id' => $warehouse->id,
        'status' => 'available',
        'attributes' => [],
    ])->assertCreated()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Product serial created successfully.')
        ->assertJsonPath('data.serial_number', 'SERIAL-0001');

    $this->assertDatabaseHas('product_serials', [
        'serial_number' => 'SERIAL-0001',
        'product_variant_id' => $variant->id,
    ]);

    $this->assertDatabaseHas('inventory_stocks', [
        'warehouse_id' => $warehouse->id,
        'product_variant_id' => $variant->id,
        'quantity' => 1,
        'reserved_quantity' => 0,
        'available_quantity' => 1,
    ]);
});
