<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

it('lists categories', function () {
    Category::factory()->count(3)->create();

    $this->get('/admin/categories')->assertSuccessful();
});

it('includes products count in categories listing payload', function () {
    $category = Category::factory()->create();

    Product::factory()->count(2)->create([
        'category_id' => $category->id,
        'brand_id' => Brand::factory()->create()->id,
    ]);

    $this->get('/admin/categories')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/categories/index')
            ->where('categories.data.0.products_count', 2)
        );
});

it('creates a root category', function () {
    $this->post('/admin/categories', [
        'name' => 'Watches',
        'is_active' => true,
    ])->assertRedirect('/admin/categories');

    $this->assertDatabaseHas('categories', ['name' => 'Watches', 'slug' => 'watches', 'parent_id' => null]);
});

it('creates a child category', function () {
    $parent = Category::factory()->create(['name' => 'Watches']);

    $this->post('/admin/categories', [
        'name' => 'Sport Watches',
        'parent_id' => $parent->id,
        'is_active' => true,
    ])->assertRedirect('/admin/categories');

    $this->assertDatabaseHas('categories', ['name' => 'Sport Watches', 'parent_id' => $parent->id]);
});

it('validates required name on create', function () {
    $this->post('/admin/categories', ['name' => ''])
        ->assertSessionHasErrors('name');
});

it('updates a category', function () {
    $category = Category::factory()->create(['name' => 'Watches']);

    $this->put("/admin/categories/{$category->id}", [
        'name' => 'Timepieces',
        'is_active' => true,
    ])->assertRedirect('/admin/categories');

    $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'Timepieces']);
});

it('deletes a category', function () {
    $category = Category::factory()->create();

    $this->delete("/admin/categories/{$category->id}")->assertRedirect('/admin/categories');

    $this->assertModelMissing($category);
});
