<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;

beforeEach(function () {
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
        'variant' => [
            'sku' => 'ROL-SUB-001-VAR',
            'price' => 15000,
            'cost' => 10000,
        ],
    ])->assertRedirect('/admin/products');

    $this->assertDatabaseHas('products', ['sku' => 'ROL-SUB-001', 'product_type' => 'serializable']);
    $this->assertDatabaseHas('product_variants', ['sku' => 'ROL-SUB-001-VAR']);
});

it('validates required fields on product create', function () {
    $this->post('/admin/products', [])
        ->assertSessionHasErrors(['name', 'sku', 'category_id', 'brand_id', 'variant']);
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
        'product_type' => $product->product_type,
        'track_stock' => true,
        'has_serial_numbers' => true,
        'status' => 'active',
    ])->assertRedirect('/admin/products');

    $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => 'New Name', 'status' => 'active']);
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
