<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Tests\TestCase;

class InventoryPhaseOneRoutesTest extends TestCase
{
    /**
     * @return array<int, string>
     */
    private function inventoryPhaseOneRoutes(): array
    {
        return [
            'admin.inventory.stocks.index',
            'admin.inventory.movements.index',
            'admin.inventory.transfers.index',
            'admin.inventory.adjustments.index',
            'admin.inventory.reservations.index',
        ];
    }

    public function test_it_requires_authentication_for_inventory_phase_one_routes(): void
    {
        foreach ($this->inventoryPhaseOneRoutes() as $routeName) {
            $this->get(route($routeName))
                ->assertRedirect(route('login'));
        }
    }

    public function test_it_renders_inventory_phase_one_routes_for_authenticated_users(): void
    {
        $user = User::factory()->admin()->create();

        foreach ($this->inventoryPhaseOneRoutes() as $routeName) {
            $this->actingAs($user)
                ->get(route($routeName))
                ->assertOk();
        }
    }

    public function test_it_renders_reservations_route_with_brand_and_category_filters(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)
            ->get(route('admin.inventory.reservations.index', [
                'brand_id' => 1,
                'category_id' => 1,
            ]))
            ->assertOk();
    }
}
