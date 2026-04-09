<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryMovementType;
use App\Enums\InventoryReservationStatus;
use App\Enums\ProductSerialStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInventoryReservationRequest;
use App\Http\Resources\InventoryReservationResource;
use App\Http\Resources\ProductVariantResource;
use App\Http\Resources\WarehouseResource;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\InventoryStock;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InventoryReservationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = InventoryReservationStatus::tryFrom((string) $request->status);

        $reservations = InventoryReservation::query()
            ->with(['warehouse', 'productVariant.product', 'reference'])
            ->when($status, fn ($query) => $query->where('status', $status->value))
            ->when($request->warehouse_id, fn ($query, $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->when($request->search, function ($query, $search) {
                $query->whereHas('productVariant', function ($variantQuery) use ($search) {
                    $variantQuery->where('sku', 'like', "%{$search}%")
                        ->orWhereHas('product', fn ($productQuery) => $productQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $serialCandidates = [];

        foreach ($reservations->getCollection() as $reservation) {
            if (
                $reservation->status !== InventoryReservationStatus::Active
                || ! $reservation->productVariant?->product?->has_serial_numbers
            ) {
                continue;
            }

            $serialCandidates[$reservation->id] = ProductSerial::query()
                ->where('product_variant_id', $reservation->product_variant_id)
                ->where('warehouse_id', $reservation->warehouse_id)
                ->where('status', ProductSerialStatus::Reserved)
                ->orderBy('serial_number')
                ->get(['id', 'serial_number'])
                ->map(fn (ProductSerial $serial) => [
                    'id' => $serial->id,
                    'serial_number' => $serial->serial_number,
                ])
                ->values()
                ->all();
        }

        return Inertia::render('inventory/reservations/index', [
            'reservations' => InventoryReservationResource::collection($reservations),
            'warehouses' => WarehouseResource::collection(Warehouse::query()->orderBy('name')->get()),
            'variants' => ProductVariantResource::collection(
                ProductVariant::query()->with('product')->where('is_active', true)->orderBy('sku')->get()
            ),
            'serial_candidates' => $serialCandidates,
            'filters' => $request->only(['status', 'warehouse_id', 'search']),
        ]);
    }

    public function store(StoreInventoryReservationRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request) {
            $warehouse = Warehouse::query()
                ->lockForUpdate()
                ->findOrFail($data['warehouse_id']);

            $variant = ProductVariant::query()
                ->with('product')
                ->findOrFail($data['product_variant_id']);

            $isSerialized = (bool) $variant->product?->has_serial_numbers;

            $stock = InventoryStock::query()
                ->where('warehouse_id', $data['warehouse_id'])
                ->where('product_variant_id', $data['product_variant_id'])
                ->lockForUpdate()
                ->first();

            $available = (float) ($stock?->available_quantity ?? 0);
            $quantity = (float) $data['quantity'];
            $serials = collect();

            if ($available < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stock disponible insuficiente para reservar esta cantidad.',
                ]);
            }

            if ($isSerialized) {
                if ($quantity !== (float) (int) $quantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'La cantidad para productos serializados debe ser un número entero.',
                    ]);
                }

                $serials = ProductSerial::query()
                    ->where('product_variant_id', $variant->id)
                    ->where('warehouse_id', $warehouse->id)
                    ->where('status', ProductSerialStatus::Available)
                    ->lockForUpdate()
                    ->limit((int) $quantity)
                    ->get();

                if ($serials->count() < (int) $quantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'No hay seriales disponibles suficientes para reservar.',
                    ]);
                }
            }

            $stock->reserved_quantity = (float) $stock->reserved_quantity + $quantity;
            $stock->available_quantity = $available - $quantity;
            $stock->save();

            $reservation = InventoryReservation::create([
                'warehouse_id' => $data['warehouse_id'],
                'product_variant_id' => $data['product_variant_id'],
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'quantity' => $data['quantity'],
                'status' => InventoryReservationStatus::Active,
                'expires_at' => $data['expires_at'] ?? null,
            ]);

            if ($isSerialized) {
                ProductSerial::query()
                    ->whereIn('id', $serials->pluck('id')->all())
                    ->update([
                        'status' => ProductSerialStatus::Reserved,
                    ]);

                foreach ($serials as $serial) {
                    InventoryMovement::create([
                        'movement_type' => InventoryMovementType::Reservation,
                        'reference_type' => InventoryReservation::class,
                        'reference_id' => $reservation->id,
                        'branch_id' => $warehouse->branch_id,
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $reservation->product_variant_id,
                        'serial_id' => $serial->id,
                        'quantity' => 1,
                        'unit_cost' => null,
                        'balance_after_movement' => $stock->quantity,
                        'notes' => 'Reserva de inventario #'.$reservation->id.' · Serial '.$serial->serial_number,
                        'user_id' => $request->user()?->id,
                    ]);
                }

                return;
            }

            InventoryMovement::create([
                'movement_type' => InventoryMovementType::Reservation,
                'reference_type' => InventoryReservation::class,
                'reference_id' => $reservation->id,
                'branch_id' => $warehouse->branch_id,
                'warehouse_id' => $warehouse->id,
                'product_variant_id' => $reservation->product_variant_id,
                'quantity' => $reservation->quantity,
                'unit_cost' => null,
                'balance_after_movement' => $stock->quantity,
                'notes' => 'Reserva de inventario #'.$reservation->id,
                'user_id' => $request->user()?->id,
            ]);
        });

        return redirect()->route('admin.inventory.reservations.index')
            ->with('success', 'Reserva creada.');
    }

    public function release(InventoryReservation $inventoryReservation, Request $request): RedirectResponse
    {
        if ($inventoryReservation->status !== InventoryReservationStatus::Active) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede liberar una reserva activa.',
            ]);
        }

        DB::transaction(function () use ($inventoryReservation, $request) {
            $warehouse = Warehouse::query()
                ->lockForUpdate()
                ->findOrFail($inventoryReservation->warehouse_id);

            $variant = ProductVariant::query()
                ->with('product')
                ->findOrFail($inventoryReservation->product_variant_id);

            $isSerialized = (bool) $variant->product?->has_serial_numbers;

            $stock = InventoryStock::query()
                ->where('warehouse_id', $inventoryReservation->warehouse_id)
                ->where('product_variant_id', $inventoryReservation->product_variant_id)
                ->lockForUpdate()
                ->first();

            $quantity = (float) $inventoryReservation->quantity;
            $serials = collect();

            if (! $stock || (float) $stock->reserved_quantity < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'Cantidad reservada insuficiente para liberar.',
                ]);
            }

            if ($isSerialized) {
                if ($quantity !== (float) (int) $quantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'La cantidad para productos serializados debe ser un número entero.',
                    ]);
                }

                $serials = ProductSerial::query()
                    ->whereIn(
                        'id',
                        collect($request->input('serial_ids', []))
                            ->map(fn ($id) => (int) $id)
                            ->filter()
                            ->unique()
                            ->values()
                            ->all()
                    )
                    ->where('product_variant_id', $variant->id)
                    ->where('warehouse_id', $warehouse->id)
                    ->where('status', ProductSerialStatus::Reserved)
                    ->lockForUpdate()
                    ->get();

                if ($serials->count() !== (int) $quantity) {
                    throw ValidationException::withMessages([
                        'serial_ids' => 'Debes seleccionar exactamente los seriales reservados que deseas liberar.',
                    ]);
                }
            }

            $stock->reserved_quantity = (float) $stock->reserved_quantity - $quantity;
            $stock->available_quantity = (float) $stock->available_quantity + $quantity;
            $stock->save();

            $inventoryReservation->update([
                'status' => InventoryReservationStatus::Released,
            ]);

            if ($isSerialized) {
                ProductSerial::query()
                    ->whereIn('id', $serials->pluck('id')->all())
                    ->update([
                        'status' => ProductSerialStatus::Available,
                    ]);

                foreach ($serials as $serial) {
                    InventoryMovement::create([
                        'movement_type' => InventoryMovementType::ReservationRelease,
                        'reference_type' => InventoryReservation::class,
                        'reference_id' => $inventoryReservation->id,
                        'branch_id' => $warehouse->branch_id,
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $inventoryReservation->product_variant_id,
                        'serial_id' => $serial->id,
                        'quantity' => 1,
                        'unit_cost' => null,
                        'balance_after_movement' => $stock->quantity,
                        'notes' => 'Liberación de reserva #'.$inventoryReservation->id.' · Serial '.$serial->serial_number,
                        'user_id' => $request->user()?->id,
                    ]);
                }

                return;
            }

            InventoryMovement::create([
                'movement_type' => InventoryMovementType::ReservationRelease,
                'reference_type' => InventoryReservation::class,
                'reference_id' => $inventoryReservation->id,
                'branch_id' => $warehouse->branch_id,
                'warehouse_id' => $warehouse->id,
                'product_variant_id' => $inventoryReservation->product_variant_id,
                'quantity' => $quantity,
                'unit_cost' => null,
                'balance_after_movement' => $stock->quantity,
                'notes' => 'Liberación de reserva #'.$inventoryReservation->id,
                'user_id' => $request->user()?->id,
            ]);
        });

        return redirect()->route('admin.inventory.reservations.index')
            ->with('success', 'Reserva liberada.');
    }

    public function consume(InventoryReservation $inventoryReservation, Request $request): RedirectResponse
    {
        if ($inventoryReservation->status !== InventoryReservationStatus::Active) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede consumir una reserva activa.',
            ]);
        }

        DB::transaction(function () use ($inventoryReservation, $request) {
            $warehouse = Warehouse::query()
                ->lockForUpdate()
                ->findOrFail($inventoryReservation->warehouse_id);

            $variant = ProductVariant::query()
                ->with('product')
                ->findOrFail($inventoryReservation->product_variant_id);

            $isSerialized = (bool) $variant->product?->has_serial_numbers;

            $stock = InventoryStock::query()
                ->where('warehouse_id', $inventoryReservation->warehouse_id)
                ->where('product_variant_id', $inventoryReservation->product_variant_id)
                ->lockForUpdate()
                ->first();

            $quantity = (float) $inventoryReservation->quantity;
            $serials = collect();

            if (! $stock || (float) $stock->reserved_quantity < $quantity || (float) $stock->quantity < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stock insuficiente para consumir esta reserva.',
                ]);
            }

            if ($isSerialized) {
                if ($quantity !== (float) (int) $quantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'La cantidad para productos serializados debe ser un número entero.',
                    ]);
                }

                $serials = ProductSerial::query()
                    ->whereIn(
                        'id',
                        collect($request->input('serial_ids', []))
                            ->map(fn ($id) => (int) $id)
                            ->filter()
                            ->unique()
                            ->values()
                            ->all()
                    )
                    ->where('product_variant_id', $variant->id)
                    ->where('warehouse_id', $warehouse->id)
                    ->where('status', ProductSerialStatus::Reserved)
                    ->lockForUpdate()
                    ->get();

                if ($serials->count() !== (int) $quantity) {
                    throw ValidationException::withMessages([
                        'serial_ids' => 'Debes seleccionar exactamente los seriales reservados que deseas consumir.',
                    ]);
                }
            }

            $stock->reserved_quantity = (float) $stock->reserved_quantity - $quantity;
            $stock->quantity = (float) $stock->quantity - $quantity;
            $stock->save();

            $inventoryReservation->update([
                'status' => InventoryReservationStatus::Consumed,
            ]);

            if ($isSerialized) {
                ProductSerial::query()
                    ->whereIn('id', $serials->pluck('id')->all())
                    ->update([
                        'status' => ProductSerialStatus::Sold,
                        'warehouse_id' => null,
                    ]);

                foreach ($serials as $serial) {
                    InventoryMovement::create([
                        'movement_type' => InventoryMovementType::Sale,
                        'reference_type' => InventoryReservation::class,
                        'reference_id' => $inventoryReservation->id,
                        'branch_id' => $warehouse->branch_id,
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $inventoryReservation->product_variant_id,
                        'serial_id' => $serial->id,
                        'quantity' => 1,
                        'unit_cost' => null,
                        'balance_after_movement' => $stock->quantity,
                        'notes' => 'Consumo de reserva #'.$inventoryReservation->id.' · Serial '.$serial->serial_number,
                        'user_id' => $request->user()?->id,
                    ]);
                }

                return;
            }

            InventoryMovement::create([
                'movement_type' => InventoryMovementType::Sale,
                'reference_type' => InventoryReservation::class,
                'reference_id' => $inventoryReservation->id,
                'branch_id' => $warehouse->branch_id,
                'warehouse_id' => $warehouse->id,
                'product_variant_id' => $inventoryReservation->product_variant_id,
                'quantity' => $quantity,
                'unit_cost' => null,
                'balance_after_movement' => $stock->quantity,
                'notes' => 'Consumo de reserva #'.$inventoryReservation->id,
                'user_id' => $request->user()?->id,
            ]);
        });

        return redirect()->route('admin.inventory.reservations.index')
            ->with('success', 'Reserva consumida.');
    }

    public function cancel(InventoryReservation $inventoryReservation, Request $request): RedirectResponse
    {
        if ($inventoryReservation->status !== InventoryReservationStatus::Active) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede cancelar una reserva activa.',
            ]);
        }

        DB::transaction(function () use ($inventoryReservation, $request) {
            $warehouse = Warehouse::query()
                ->lockForUpdate()
                ->findOrFail($inventoryReservation->warehouse_id);

            $variant = ProductVariant::query()
                ->with('product')
                ->findOrFail($inventoryReservation->product_variant_id);

            $isSerialized = (bool) $variant->product?->has_serial_numbers;

            $stock = InventoryStock::query()
                ->where('warehouse_id', $inventoryReservation->warehouse_id)
                ->where('product_variant_id', $inventoryReservation->product_variant_id)
                ->lockForUpdate()
                ->first();

            $quantity = (float) $inventoryReservation->quantity;
            $serials = collect();

            if (! $stock || (float) $stock->reserved_quantity < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'Cantidad reservada insuficiente para cancelar la reserva.',
                ]);
            }

            if ($isSerialized) {
                if ($quantity !== (float) (int) $quantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'La cantidad para productos serializados debe ser un número entero.',
                    ]);
                }

                $serials = ProductSerial::query()
                    ->whereIn(
                        'id',
                        collect($request->input('serial_ids', []))
                            ->map(fn ($id) => (int) $id)
                            ->filter()
                            ->unique()
                            ->values()
                            ->all()
                    )
                    ->where('product_variant_id', $variant->id)
                    ->where('warehouse_id', $warehouse->id)
                    ->where('status', ProductSerialStatus::Reserved)
                    ->lockForUpdate()
                    ->get();

                if ($serials->count() !== (int) $quantity) {
                    throw ValidationException::withMessages([
                        'serial_ids' => 'Debes seleccionar exactamente los seriales reservados que deseas cancelar.',
                    ]);
                }
            }

            $stock->reserved_quantity = (float) $stock->reserved_quantity - $quantity;
            $stock->available_quantity = (float) $stock->available_quantity + $quantity;
            $stock->save();

            $inventoryReservation->update([
                'status' => InventoryReservationStatus::Cancelled,
            ]);

            if ($isSerialized) {
                ProductSerial::query()
                    ->whereIn('id', $serials->pluck('id')->all())
                    ->update([
                        'status' => ProductSerialStatus::Available,
                    ]);

                foreach ($serials as $serial) {
                    InventoryMovement::create([
                        'movement_type' => InventoryMovementType::ReservationRelease,
                        'reference_type' => InventoryReservation::class,
                        'reference_id' => $inventoryReservation->id,
                        'branch_id' => $warehouse->branch_id,
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $inventoryReservation->product_variant_id,
                        'serial_id' => $serial->id,
                        'quantity' => 1,
                        'unit_cost' => null,
                        'balance_after_movement' => $stock->quantity,
                        'notes' => 'Cancelación de reserva #'.$inventoryReservation->id.' · Serial '.$serial->serial_number,
                        'user_id' => $request->user()?->id,
                    ]);
                }

                return;
            }

            InventoryMovement::create([
                'movement_type' => InventoryMovementType::ReservationRelease,
                'reference_type' => InventoryReservation::class,
                'reference_id' => $inventoryReservation->id,
                'branch_id' => $warehouse->branch_id,
                'warehouse_id' => $warehouse->id,
                'product_variant_id' => $inventoryReservation->product_variant_id,
                'quantity' => $quantity,
                'unit_cost' => null,
                'balance_after_movement' => $stock->quantity,
                'notes' => 'Cancelación de reserva #'.$inventoryReservation->id,
                'user_id' => $request->user()?->id,
            ]);
        });

        return redirect()->route('admin.inventory.reservations.index')
            ->with('success', 'Reserva cancelada.');
    }
}
