<?php

namespace Tests\Feature\Admin;

use App\Enums\InventoryAdjustmentStatus;
use App\Models\Branch;
use App\Models\InventoryAdjustment;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryAdjustmentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Branch $branch;

    private Warehouse $warehouse;

    private ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->branch = Branch::create([
            'name' => 'Main Branch',
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'branch_id' => $this->branch->id,
            'name' => 'Bodega Principal',
            'type' => 'main',
            'allows_sales' => true,
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::factory()->create();
    }

    public function test_it_creates_adjustment_as_draft_with_items(): void
    {
        $response = $this->post(route('admin.inventory.adjustments.store'), [
            'warehouse_id' => $this->warehouse->id,
            'adjustment_type' => 'increase',
            'reason' => 'Ajuste inicial',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 2,
                    'unit_cost' => 10,
                ],
            ],
        ]);

        $response->assertRedirect(route('admin.inventory.adjustments.index'));

        $adjustment = InventoryAdjustment::query()->latest('id')->first();

        $this->assertNotNull($adjustment);
        $this->assertSame(InventoryAdjustmentStatus::Draft, $adjustment->status);
        $this->assertSame(1, $adjustment->items()->count());
    }

    public function test_it_confirms_increase_adjustment_and_records_movement(): void
    {
        $this->post(route('admin.inventory.adjustments.store'), [
            'warehouse_id' => $this->warehouse->id,
            'adjustment_type' => 'increase',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 3,
                    'unit_cost' => 20,
                ],
            ],
        ]);

        $adjustment = InventoryAdjustment::query()->latest('id')->firstOrFail();

        $response = $this->post(route('admin.inventory.adjustments.confirm', $adjustment));

        $response->assertRedirect(route('admin.inventory.adjustments.index'));

        $adjustment->refresh();

        $stock = InventoryStock::query()
            ->where('warehouse_id', $this->warehouse->id)
            ->where('product_variant_id', $this->variant->id)
            ->firstOrFail();

        $this->assertSame(InventoryAdjustmentStatus::Confirmed, $adjustment->status);
        $this->assertSame(3.0, (float) $stock->quantity);
        $this->assertSame(3.0, (float) $stock->available_quantity);
        $this->assertSame(1, InventoryMovement::query()->where('movement_type', 'adjustment_in')->where('reference_id', $adjustment->id)->count());
    }

    public function test_it_rejects_confirm_when_decrease_has_insufficient_stock(): void
    {
        InventoryStock::create([
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 2,
            'reserved_quantity' => 0,
            'available_quantity' => 2,
            'average_cost' => 0,
        ]);

        $this->post(route('admin.inventory.adjustments.store'), [
            'warehouse_id' => $this->warehouse->id,
            'adjustment_type' => 'decrease',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 5,
                ],
            ],
        ]);

        $adjustment = InventoryAdjustment::query()->latest('id')->firstOrFail();

        $response = $this->post(route('admin.inventory.adjustments.confirm', $adjustment));

        $response->assertSessionHasErrors('items');

        $adjustment->refresh();

        $stock = InventoryStock::query()
            ->where('warehouse_id', $this->warehouse->id)
            ->where('product_variant_id', $this->variant->id)
            ->firstOrFail();

        $this->assertSame(InventoryAdjustmentStatus::Draft, $adjustment->status);
        $this->assertSame(2.0, (float) $stock->quantity);
        $this->assertSame(0, InventoryMovement::query()->where('reference_id', $adjustment->id)->count());
    }
}
