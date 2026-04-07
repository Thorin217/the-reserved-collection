<?php

namespace Tests\Feature\Admin;

use App\Enums\InventoryTransferStatus;
use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\InventoryTransfer;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTransferWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Branch $branch;

    private Warehouse $fromWarehouse;

    private Warehouse $toWarehouse;

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

        $this->fromWarehouse = Warehouse::create([
            'branch_id' => $this->branch->id,
            'name' => 'Bodega Origen',
            'type' => 'main',
            'allows_sales' => true,
            'is_active' => true,
        ]);

        $this->toWarehouse = Warehouse::create([
            'branch_id' => $this->branch->id,
            'name' => 'Bodega Destino',
            'type' => 'main',
            'allows_sales' => true,
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::factory()->create();

        InventoryStock::create([
            'warehouse_id' => $this->fromWarehouse->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'reserved_quantity' => 0,
            'available_quantity' => 10,
            'average_cost' => 0,
        ]);
    }

    public function test_it_creates_transfer_as_draft_with_items(): void
    {
        $response = $this->post(route('admin.inventory.transfers.store'), [
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'notes' => 'Transferencia inicial',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 4,
                ],
            ],
        ]);

        $response->assertRedirect(route('admin.inventory.transfers.index'));

        $transfer = InventoryTransfer::query()->latest('id')->first();

        $this->assertNotNull($transfer);
        $this->assertSame(InventoryTransferStatus::Draft, $transfer->status);
        $this->assertSame(1, $transfer->items()->count());
    }

    public function test_it_sends_transfer_and_records_transfer_out_movement(): void
    {
        $this->post(route('admin.inventory.transfers.store'), [
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'items' => [
                ['product_variant_id' => $this->variant->id, 'quantity' => 3],
            ],
        ]);

        $transfer = InventoryTransfer::query()->latest('id')->firstOrFail();

        $response = $this->post(route('admin.inventory.transfers.send', $transfer));

        $response->assertRedirect(route('admin.inventory.transfers.index'));

        $transfer->refresh();

        $originStock = InventoryStock::query()
            ->where('warehouse_id', $this->fromWarehouse->id)
            ->where('product_variant_id', $this->variant->id)
            ->firstOrFail();

        $this->assertSame(InventoryTransferStatus::Sent, $transfer->status);
        $this->assertSame(7.0, (float) $originStock->quantity);
        $this->assertSame(7.0, (float) $originStock->available_quantity);
        $this->assertSame(1, InventoryMovement::query()->where('movement_type', 'transfer_out')->where('reference_id', $transfer->id)->count());
    }

    public function test_it_receives_transfer_and_records_transfer_in_movement(): void
    {
        $this->post(route('admin.inventory.transfers.store'), [
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'items' => [
                ['product_variant_id' => $this->variant->id, 'quantity' => 5],
            ],
        ]);

        $transfer = InventoryTransfer::query()->latest('id')->firstOrFail();
        $this->post(route('admin.inventory.transfers.send', $transfer));

        $transfer->refresh();
        $item = $transfer->items()->firstOrFail();

        $response = $this->post(route('admin.inventory.transfers.receive', $transfer), [
            'items' => [
                [
                    'id' => $item->id,
                    'received_quantity' => 5,
                ],
            ],
        ]);

        $response->assertRedirect(route('admin.inventory.transfers.index'));

        $transfer->refresh();

        $destinationStock = InventoryStock::query()
            ->where('warehouse_id', $this->toWarehouse->id)
            ->where('product_variant_id', $this->variant->id)
            ->firstOrFail();

        $this->assertSame(InventoryTransferStatus::Received, $transfer->status);
        $this->assertSame(5.0, (float) $destinationStock->quantity);
        $this->assertSame(5.0, (float) $destinationStock->available_quantity);
        $this->assertSame(1, InventoryMovement::query()->where('movement_type', 'transfer_in')->where('reference_id', $transfer->id)->count());
    }
}
