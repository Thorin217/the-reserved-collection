<?php

namespace Tests\Feature\Admin;

use App\Models\Branch;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BranchWarehouseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_it_lists_branches_and_warehouses_pages(): void
    {
        $branch = Branch::create([
            'name' => 'Main Branch',
            'is_active' => true,
        ]);

        Warehouse::create([
            'branch_id' => $branch->id,
            'name' => 'Branch Warehouse',
            'type' => 'main',
            'allows_sales' => true,
            'is_active' => true,
        ]);

        $this->get('/admin/branches')
            ->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/branches/index')
                ->where('branches.data.0.warehouses_count', 1)
            );

        $this->get('/admin/warehouses')->assertSuccessful();
    }

    public function test_it_creates_updates_and_deletes_a_branch(): void
    {
        $this->post('/admin/branches', [
            'name' => 'North Branch',
            'phone' => '+1 555 111',
            'city' => 'Miami',
            'country' => 'US',
            'is_active' => true,
        ])->assertRedirect('/admin/branches');

        $branch = Branch::query()->where('name', 'North Branch')->firstOrFail();

        $this->put('/admin/branches/'.$branch->id, [
            'name' => 'North Branch Updated',
            'phone' => '+1 555 222',
            'city' => 'Orlando',
            'country' => 'US',
            'is_active' => true,
        ])->assertRedirect('/admin/branches');

        $this->assertDatabaseHas('branches', [
            'id' => $branch->id,
            'name' => 'North Branch Updated',
        ]);

        $this->delete('/admin/branches/'.$branch->id)
            ->assertRedirect('/admin/branches');

        $this->assertDatabaseMissing('branches', [
            'id' => $branch->id,
        ]);
    }

    public function test_it_creates_updates_and_deletes_a_warehouse(): void
    {
        $branch = Branch::create([
            'name' => 'Central Branch',
            'is_active' => true,
        ]);

        $this->post('/admin/warehouses', [
            'branch_id' => $branch->id,
            'name' => 'Main Warehouse',
            'type' => 'main',
            'allows_sales' => true,
            'description' => 'Primary warehouse',
            'is_active' => true,
        ])->assertRedirect('/admin/warehouses');

        $warehouse = Warehouse::query()->where('name', 'Main Warehouse')->firstOrFail();

        $this->put('/admin/warehouses/'.$warehouse->id, [
            'branch_id' => $branch->id,
            'name' => 'Main Warehouse Updated',
            'type' => 'display',
            'allows_sales' => false,
            'description' => 'Display stock only',
            'is_active' => true,
        ])->assertRedirect('/admin/warehouses');

        $this->assertDatabaseHas('warehouses', [
            'id' => $warehouse->id,
            'name' => 'Main Warehouse Updated',
            'type' => 'display',
        ]);

        $this->delete('/admin/warehouses/'.$warehouse->id)
            ->assertRedirect('/admin/warehouses');

        $this->assertDatabaseMissing('warehouses', [
            'id' => $warehouse->id,
        ]);
    }
}
