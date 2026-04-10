<?php

namespace Tests\Feature\Admin;

use App\Enums\InventoryTransferStatus;
use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\InventoryTransfer;
use App\Models\Product;
use App\Models\ProductSerial;
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

        $this->variant = ProductVariant::factory()
            ->for(Product::factory()->simple())
            ->create();

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

    public function test_it_tracks_serial_status_and_movements_for_serialized_transfer(): void
    {
        $serializedVariant = ProductVariant::factory()->create();

        InventoryStock::create([
            'warehouse_id' => $this->fromWarehouse->id,
            'product_variant_id' => $serializedVariant->id,
            'quantity' => 3,
            'reserved_quantity' => 0,
            'available_quantity' => 3,
            'average_cost' => 0,
        ]);

        $serials = ProductSerial::factory()
            ->count(3)
            ->available()
            ->state([
                'product_variant_id' => $serializedVariant->id,
                'warehouse_id' => $this->fromWarehouse->id,
            ])
            ->create();

        $this->post(route('admin.inventory.transfers.store'), [
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'items' => [
                ['product_variant_id' => $serializedVariant->id, 'quantity' => 2],
            ],
        ])->assertRedirect(route('admin.inventory.transfers.index'));

        $transfer = InventoryTransfer::query()->latest('id')->firstOrFail();
        $item = $transfer->items()->firstOrFail();
        $selectedSerialIds = $serials->take(2)->pluck('id')->all();

        $this->post(route('admin.inventory.transfers.send', $transfer), [
            'items' => [
                [
                    'id' => $item->id,
                    'serial_ids' => $selectedSerialIds,
                ],
            ],
        ])
            ->assertRedirect(route('admin.inventory.transfers.index'));

        $serials->each->refresh();

        $inTransitSerials = $serials->filter(fn (ProductSerial $serial) => $serial->status->value === 'in_transit');
        $availableSerials = $serials->filter(fn (ProductSerial $serial) => $serial->status->value === 'available');

        $this->assertCount(2, $inTransitSerials);
        $this->assertCount(1, $availableSerials);

        $transfer->refresh();

        $this->post(route('admin.inventory.transfers.receive', $transfer), [
            'items' => [
                [
                    'id' => $item->id,
                    'received_quantity' => 2,
                    'serial_ids' => $selectedSerialIds,
                ],
            ],
        ])->assertRedirect(route('admin.inventory.transfers.index'));

        $serials->each->refresh();

        $receivedSerials = $serials->filter(
            fn (ProductSerial $serial) => $serial->status->value === 'available' && $serial->warehouse_id === $this->toWarehouse->id
        );

        $this->assertCount(2, $receivedSerials);
        $this->assertSame(
            2,
            InventoryMovement::query()
                ->where('movement_type', 'transfer_out')
                ->where('reference_id', $transfer->id)
                ->whereNotNull('serial_id')
                ->count(),
        );
        $this->assertSame(
            2,
            InventoryMovement::query()
                ->where('movement_type', 'transfer_in')
                ->where('reference_id', $transfer->id)
                ->whereNotNull('serial_id')
                ->count(),
        );
    }

    public function test_it_includes_transfer_serials_payload_for_view_modal(): void
    {
        $serializedVariant = ProductVariant::factory()->create();

        $serials = ProductSerial::factory()
            ->count(2)
            ->state([
                'product_variant_id' => $serializedVariant->id,
                'warehouse_id' => null,
                'status' => 'in_transit',
            ])
            ->create();

        $transfer = InventoryTransfer::create([
            'code' => 'TRF-VIEW-001',
            'from_warehouse_id' => $this->fromWarehouse->id,
            'to_warehouse_id' => $this->toWarehouse->id,
            'status' => InventoryTransferStatus::Sent,
            'requested_by' => $this->user->id,
            'approved_by' => $this->user->id,
            'sent_at' => now(),
        ]);

        $transfer->items()->create([
            'product_variant_id' => $serializedVariant->id,
            'quantity' => 2,
            'received_quantity' => 0,
        ]);

        foreach ($serials as $serial) {
            InventoryMovement::create([
                'movement_type' => 'transfer_out',
                'reference_type' => InventoryTransfer::class,
                'reference_id' => $transfer->id,
                'branch_id' => $this->branch->id,
                'warehouse_id' => $this->fromWarehouse->id,
                'product_variant_id' => $serializedVariant->id,
                'serial_id' => $serial->id,
                'quantity' => 1,
                'unit_cost' => null,
                'balance_after_movement' => 0,
                'notes' => 'Test transfer out',
                'user_id' => $this->user->id,
            ]);
        }

        $response = $this->get(route('admin.inventory.transfers.index'));

        $response->assertSuccessful();

        /** @var array<string, mixed> $page */
        $page = $response->viewData('page');

        $serialPayload = data_get(
            $page,
            "props.transfer_serials.{$transfer->id}.sent.{$serializedVariant->id}",
            [],
        );

        $this->assertCount(2, $serialPayload);
    }
}
