<?php

namespace Tests\Feature\Admin;

use App\Enums\InventoryReservationStatus;
use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryReservationWorkflowTest extends TestCase
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

        $this->variant = ProductVariant::factory()
            ->for(Product::factory()->simple())
            ->create();

        InventoryStock::create([
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'reserved_quantity' => 0,
            'available_quantity' => 10,
            'average_cost' => 0,
        ]);
    }

    public function test_it_creates_active_reservation_and_registers_movement(): void
    {
        $response = $this->post(route('admin.inventory.reservations.store'), [
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 4,
        ]);

        $response->assertRedirect(route('admin.inventory.reservations.index'));

        $reservation = InventoryReservation::query()->latest('id')->firstOrFail();
        $stock = InventoryStock::query()
            ->where('warehouse_id', $this->warehouse->id)
            ->where('product_variant_id', $this->variant->id)
            ->firstOrFail();

        $this->assertSame(InventoryReservationStatus::Active, $reservation->status);
        $this->assertSame(10.0, (float) $stock->quantity);
        $this->assertSame(4.0, (float) $stock->reserved_quantity);
        $this->assertSame(6.0, (float) $stock->available_quantity);
        $this->assertSame(1, InventoryMovement::query()->where('movement_type', 'reservation')->where('reference_id', $reservation->id)->count());
    }

    public function test_it_releases_active_reservation_and_restores_available_stock(): void
    {
        $this->post(route('admin.inventory.reservations.store'), [
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 3,
        ]);

        $reservation = InventoryReservation::query()->latest('id')->firstOrFail();

        $response = $this->post(route('admin.inventory.reservations.release', $reservation));

        $response->assertRedirect(route('admin.inventory.reservations.index'));

        $reservation->refresh();
        $stock = InventoryStock::query()
            ->where('warehouse_id', $this->warehouse->id)
            ->where('product_variant_id', $this->variant->id)
            ->firstOrFail();

        $this->assertSame(InventoryReservationStatus::Released, $reservation->status);
        $this->assertSame(0.0, (float) $stock->reserved_quantity);
        $this->assertSame(10.0, (float) $stock->available_quantity);
        $this->assertSame(1, InventoryMovement::query()->where('movement_type', 'reservation_release')->where('reference_id', $reservation->id)->count());
    }

    public function test_it_consumes_active_reservation_and_reduces_stock_quantity(): void
    {
        $this->post(route('admin.inventory.reservations.store'), [
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 2,
        ]);

        $reservation = InventoryReservation::query()->latest('id')->firstOrFail();

        $response = $this->post(route('admin.inventory.reservations.consume', $reservation));

        $response->assertRedirect(route('admin.inventory.reservations.index'));

        $reservation->refresh();
        $stock = InventoryStock::query()
            ->where('warehouse_id', $this->warehouse->id)
            ->where('product_variant_id', $this->variant->id)
            ->firstOrFail();

        $this->assertSame(InventoryReservationStatus::Consumed, $reservation->status);
        $this->assertSame(8.0, (float) $stock->quantity);
        $this->assertSame(0.0, (float) $stock->reserved_quantity);
        $this->assertSame(8.0, (float) $stock->available_quantity);
        $this->assertSame(1, InventoryMovement::query()->where('movement_type', 'sale')->where('reference_id', $reservation->id)->count());
    }

    public function test_it_prevents_reservation_when_available_stock_is_insufficient(): void
    {
        $response = $this->post(route('admin.inventory.reservations.store'), [
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
        ]);

        $response->assertSessionHasErrors('quantity');

        $stock = InventoryStock::query()
            ->where('warehouse_id', $this->warehouse->id)
            ->where('product_variant_id', $this->variant->id)
            ->firstOrFail();

        $this->assertSame(10.0, (float) $stock->quantity);
        $this->assertSame(0.0, (float) $stock->reserved_quantity);
        $this->assertSame(10.0, (float) $stock->available_quantity);
        $this->assertSame(0, InventoryReservation::query()->count());
    }

    public function test_it_updates_serials_and_movements_when_consuming_serialized_reservation(): void
    {
        $serializedVariant = ProductVariant::factory()->create();

        InventoryStock::create([
            'warehouse_id' => $this->warehouse->id,
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
                'warehouse_id' => $this->warehouse->id,
            ])
            ->create();

        $this->post(route('admin.inventory.reservations.store'), [
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $serializedVariant->id,
            'quantity' => 2,
        ])->assertRedirect(route('admin.inventory.reservations.index'));

        $serials->each->refresh();

        $reservedSerials = $serials->filter(fn (ProductSerial $serial) => $serial->status->value === 'reserved');

        $this->assertCount(2, $reservedSerials);

        $reservation = InventoryReservation::query()->latest('id')->firstOrFail();

        $serialIds = ProductSerial::query()
            ->where('product_variant_id', $serializedVariant->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->where('status', 'reserved')
            ->pluck('id')
            ->take(2)
            ->values()
            ->all();

        $this->post(route('admin.inventory.reservations.consume', $reservation), [
            'serial_ids' => $serialIds,
        ])
            ->assertRedirect(route('admin.inventory.reservations.index'));

        $serials->each->refresh();

        $soldSerials = $serials->filter(fn (ProductSerial $serial) => $serial->status->value === 'sold');

        $this->assertCount(2, $soldSerials);
        $this->assertTrue($soldSerials->every(fn (ProductSerial $serial) => $serial->warehouse_id === null));
        $this->assertSame(
            2,
            InventoryMovement::query()
                ->where('movement_type', 'sale')
                ->where('reference_id', $reservation->id)
                ->whereNotNull('serial_id')
                ->count(),
        );
    }

    public function test_it_renders_reservations_index_even_with_invalid_reference_type_values(): void
    {
        InventoryReservation::create([
            'warehouse_id' => $this->warehouse->id,
            'product_variant_id' => $this->variant->id,
            'reference_type' => 'seed_phase_one',
            'reference_id' => 1001,
            'quantity' => 1,
            'status' => InventoryReservationStatus::Active,
            'expires_at' => now()->addDay(),
        ]);

        $this->get(route('admin.inventory.reservations.index'))
            ->assertSuccessful();
    }
}
