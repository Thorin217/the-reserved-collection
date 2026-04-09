<?php

use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Warehouse;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutMiddleware();
    $this->actingAs(User::factory()->create());
    $this->brand = Brand::factory()->create();
    $this->category = Category::factory()->create();
});

it('lists products', function () {
    Product::factory()->count(3)->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
    ]);

    $this->get('/admin/products')->assertSuccessful();
});

it('includes variants count in products listing payload', function () {
    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
    ]);

    ProductVariant::factory()->count(2)->create([
        'product_id' => $product->id,
    ]);

    $this->get('/admin/products')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/products/index')
            ->where('products.data.0.variants_count', 2)
        );
});

it('shows product create form', function () {
    $this->get('/admin/products/create')->assertSuccessful();
});

it('creates a serializable product with variant', function () {
    $this->post('/admin/products', [
        'category_id' => $this->category->id,
        'brand_id' => $this->brand->id,
        'name' => 'Rolex Submariner',
        'sku' => 'ROL-SUB-001',
        'product_type' => 'serializable',
        'has_serial_numbers' => true,
        'track_stock' => true,
        'status' => 'active',
        'variants' => [
            [
                'sku' => 'ROL-SUB-001-VAR',
                'price' => 15000,
                'cost' => 10000,
            ],
            [
                'sku' => 'ROL-SUB-001-VAR-2',
                'price' => 17000,
                'cost' => 12000,
            ],
        ],
    ])->assertRedirect('/admin/products');

    $this->assertDatabaseHas('products', ['sku' => 'ROL-SUB-001', 'product_type' => 'serializable']);
    $this->assertDatabaseHas('product_variants', ['sku' => 'ROL-SUB-001-VAR']);
    $this->assertDatabaseHas('product_variants', ['sku' => 'ROL-SUB-001-VAR-2']);
});

it('validates required fields on product create', function () {
    $this->post('/admin/products', [])
        ->assertSessionHasErrors(['name', 'sku', 'category_id', 'brand_id', 'variants']);
});

it('updates a product', function () {
    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
        'name' => 'Old Name',
        'status' => 'draft',
    ]);

    $this->put("/admin/products/{$product->id}", [
        'category_id' => $this->category->id,
        'brand_id' => $this->brand->id,
        'name' => 'New Name',
        'sku' => $product->sku,
        'product_type' => $product->product_type->value,
        'track_stock' => true,
        'has_serial_numbers' => true,
        'status' => 'active',
    ])->assertRedirect('/admin/products');

    $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => 'New Name', 'status' => 'active']);
});

it('adds variants when updating a product', function () {
    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
        'name' => 'Omega Speedmaster',
        'sku' => 'OMG-SPD-001',
        'product_type' => 'variant',
        'status' => 'active',
    ]);

    $existingVariant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'sku' => 'OMG-SPD-001-VAR-1',
    ]);

    $this->put("/admin/products/{$product->id}", [
        'category_id' => $this->category->id,
        'brand_id' => $this->brand->id,
        'name' => 'Omega Speedmaster',
        'sku' => 'OMG-SPD-001',
        'product_type' => 'variant',
        'track_stock' => true,
        'has_serial_numbers' => false,
        'status' => 'active',
        'variants' => [
            [
                'id' => $existingVariant->id,
                'sku' => 'OMG-SPD-001-VAR-1',
                'price' => 1000,
                'cost' => 700,
            ],
            [
                'sku' => 'OMG-SPD-001-VAR-2',
                'price' => 1200,
                'cost' => 800,
            ],
        ],
    ])->assertRedirect('/admin/products');

    expect($product->variants()->count())->toBe(2);

    $this->assertDatabaseHas('product_variants', [
        'product_id' => $product->id,
        'sku' => 'OMG-SPD-001-VAR-2',
    ]);
});

it('deletes a product', function () {
    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
    ]);

    $this->delete("/admin/products/{$product->id}")->assertRedirect('/admin/products');

    $this->assertModelMissing($product);
});

it('shows product serials page', function () {
    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
        'has_serial_numbers' => true,
        'product_type' => 'serializable',
    ]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
    ProductSerial::factory()->count(3)->create(['product_variant_id' => $variant->id]);

    $this->get("/admin/products/{$product->id}/serials")->assertSuccessful();
});

it('registers a serial for a product', function () {
    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
    ]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

    $this->post("/admin/products/{$product->id}/serials", [
        'product_variant_id' => $variant->id,
        'serial_number' => 'SN-ROL-12345',
        'status' => 'available',
    ])->assertRedirect("/admin/products/{$product->id}/serials");

    $this->assertDatabaseHas('product_serials', [
        'product_variant_id' => $variant->id,
        'serial_number' => 'SN-ROL-12345',
        'status' => 'available',
    ]);
});

it('creates initial stock when registering a serial in a warehouse', function () {
    $branch = Branch::create([
        'name' => 'Main Branch',
        'is_active' => true,
    ]);

    $warehouse = Warehouse::create([
        'branch_id' => $branch->id,
        'name' => 'Main Warehouse',
        'type' => 'main',
        'allows_sales' => true,
        'is_active' => true,
    ]);

    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
        'has_serial_numbers' => true,
        'product_type' => 'serializable',
    ]);

    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $this->post("/admin/products/{$product->id}/serials", [
        'product_variant_id' => $variant->id,
        'serial_number' => 'SN-INIT-00001',
        'warehouse_id' => $warehouse->id,
        'status' => 'available',
    ])->assertRedirect("/admin/products/{$product->id}/serials");

    $stock = InventoryStock::query()
        ->where('warehouse_id', $warehouse->id)
        ->where('product_variant_id', $variant->id)
        ->first();

    expect($stock)->not->toBeNull();
    expect((float) $stock->quantity)->toBe(1.0);
    expect((float) $stock->available_quantity)->toBe(1.0);
    expect((float) $stock->reserved_quantity)->toBe(0.0);
});
