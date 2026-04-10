<?php

namespace Tests\Feature\Admin;

use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryOpeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware();
        $this->actingAs(User::factory()->create());
    }

    public function test_it_registers_opening_for_non_serialized_variant(): void
    {
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

        $product = Product::factory()->simple()->create();
        $variant = ProductVariant::factory()->for($product)->create();

        $this->post(route('admin.inventory.movements.opening'), [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'quantity' => 5,
            'unit_cost' => 1500,
            'notes' => 'Initial stock load',
        ])->assertRedirect(route('admin.inventory.movements.index'));

        $stock = InventoryStock::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('product_variant_id', $variant->id)
            ->firstOrFail();

        $this->assertSame(5.0, (float) $stock->quantity);
        $this->assertSame(5.0, (float) $stock->available_quantity);
        $this->assertSame(1, InventoryMovement::query()->where('movement_type', 'opening')->count());
    }

    public function test_it_registers_opening_for_serialized_variant_with_serials(): void
    {
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
            'has_serial_numbers' => true,
            'track_stock' => true,
        ]);
        $variant = ProductVariant::factory()->for($product)->create();

        $this->post(route('admin.inventory.movements.opening'), [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
            'serial_numbers' => ['SN-OPEN-001', 'SN-OPEN-002'],
            'notes' => 'Serialized opening',
        ])->assertRedirect(route('admin.inventory.movements.index'));

        $stock = InventoryStock::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('product_variant_id', $variant->id)
            ->firstOrFail();

        $this->assertSame(2.0, (float) $stock->quantity);
        $this->assertSame(2.0, (float) $stock->available_quantity);
        $this->assertSame(2, ProductSerial::query()->where('product_variant_id', $variant->id)->count());
        $this->assertSame(2, InventoryMovement::query()->where('movement_type', 'opening')->whereNotNull('serial_id')->count());

        $this->assertDatabaseHas('product_serials', [
            'serial_number' => 'SN-OPEN-001',
            'warehouse_id' => $warehouse->id,
            'status' => 'available',
        ]);
    }
}
