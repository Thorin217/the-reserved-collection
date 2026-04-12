<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->admin()->create();
    $this->actingAs($this->user);
});

it('lists brands', function () {
    Brand::factory()->count(3)->create();

    $this->get('/admin/brands')->assertSuccessful();
});

it('includes products count in brands listing payload', function () {
    $brand = Brand::factory()->create();

    Product::factory()->count(2)->create([
        'brand_id' => $brand->id,
        'category_id' => Category::factory()->create()->id,
    ]);

    $this->get('/admin/brands')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/brands/index')
            ->where('brands.data.0.products_count', 2)
        );
});

it('filters brands by search and status', function () {
    Brand::factory()->create(['name' => 'Rolex', 'is_active' => true]);
    Brand::factory()->create(['name' => 'Omega', 'is_active' => false]);

    $this->get('/admin/brands?search=Rolex&status=active')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/brands/index')
            ->where('brands.data.0.name', 'Rolex')
            ->where('brands.data', fn ($brands) => count($brands) === 1)
        );
});

it('creates a brand', function () {
    $this->post('/admin/brands', [
        'name' => 'Rolex',
        'description' => 'Luxury watches',
        'is_active' => true,
    ])->assertRedirect('/admin/brands');

    $this->assertDatabaseHas('brands', ['name' => 'Rolex', 'slug' => 'rolex']);
});

it('validates required name on create', function () {
    $this->post('/admin/brands', ['name' => ''])
        ->assertSessionHasErrors('name');
});

it('prevents duplicate brand names', function () {
    Brand::factory()->create(['name' => 'Rolex']);

    $this->post('/admin/brands', ['name' => 'Rolex'])
        ->assertSessionHasErrors('name');
});

it('updates a brand', function () {
    $brand = Brand::factory()->create(['name' => 'Rolex']);

    $this->put("/admin/brands/{$brand->id}", [
        'name' => 'Rolex Updated',
        'description' => 'Updated description',
        'is_active' => true,
    ])->assertRedirect('/admin/brands');

    $this->assertDatabaseHas('brands', ['id' => $brand->id, 'name' => 'Rolex Updated']);
});

it('deletes a brand', function () {
    $brand = Brand::factory()->create();

    $this->delete("/admin/brands/{$brand->id}")->assertRedirect('/admin/brands');

    $this->assertModelMissing($brand);
});
