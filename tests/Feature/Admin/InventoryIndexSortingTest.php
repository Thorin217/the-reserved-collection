<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryIndexSortingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_it_renders_adjustments_index_with_sort_params(): void
    {
        $this->get(route('admin.inventory.adjustments.index', [
            'sort_by' => 'code',
            'sort_dir' => 'asc',
        ]))->assertSuccessful();
    }

    public function test_it_renders_reservations_index_with_sort_params(): void
    {
        $this->get(route('admin.inventory.reservations.index', [
            'sort_by' => 'quantity',
            'sort_dir' => 'desc',
        ]))->assertSuccessful();
    }

    public function test_it_renders_transfers_index_with_sort_params(): void
    {
        $this->get(route('admin.inventory.transfers.index', [
            'sort_by' => 'status',
            'sort_dir' => 'asc',
        ]))->assertSuccessful();
    }
}
