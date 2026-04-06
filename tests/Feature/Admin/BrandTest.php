<?php

use App\Models\Brand;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('lists brands', function () {
    Brand::factory()->count(3)->create();

    $this->get('/admin/brands')->assertSuccessful();
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
