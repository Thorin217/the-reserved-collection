<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryMovementType;
use App\Enums\InventoryTransferStatus;
use App\Enums\ProductSerialStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReceiveInventoryTransferRequest;
use App\Http\Requests\Admin\StoreInventoryTransferRequest;
use App\Http\Requests\Admin\UpdateInventoryTransferRequest;
use App\Http\Resources\InventoryTransferResource;
use App\Http\Resources\ProductVariantResource;
use App\Http\Resources\WarehouseResource;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransferItem;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InventoryTransferController extends Controller
{
    public function index(Request $request): Response
    {
        $status = InventoryTransferStatus::tryFrom((string) $request->status);

        $transfers = InventoryTransfer::query()
            ->with(['fromWarehouse', 'toWarehouse', 'requester', 'approver', 'receiver', 'items.productVariant.product'])
            ->withCount('items')
            ->when($status, fn ($query) => $query->where('status', $status->value))
            ->when($request->from_warehouse_id, fn ($query, $fromWarehouseId) => $query->where('from_warehouse_id', $fromWarehouseId))
            ->when($request->to_warehouse_id, fn ($query, $toWarehouseId) => $query->where('to_warehouse_id', $toWarehouseId))
            ->when($request->search, fn ($query, $search) => $query->where('code', 'like', "%{$search}%"))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $serialCandidates = [
            'send' => [],
            'receive' => [],
        ];

        foreach ($transfers->getCollection() as $transfer) {
            foreach ($transfer->items as $item) {
                if (! $item->productVariant?->product?->has_serial_numbers) {
                    continue;
                }

                if ($transfer->status === InventoryTransferStatus::Draft) {
                    $serialCandidates['send'][$item->id] = ProductSerial::query()
                        ->where('product_variant_id', $item->product_variant_id)
                        ->where('warehouse_id', $transfer->from_warehouse_id)
                        ->where('status', ProductSerialStatus::Available)
                        ->orderBy('serial_number')
                        ->get(['id', 'serial_number'])
                        ->map(fn (ProductSerial $serial) => [
                            'id' => $serial->id,
                            'serial_number' => $serial->serial_number,
                        ])
                        ->values()
                        ->all();
                }

                if ($transfer->status === InventoryTransferStatus::Sent) {
                    $allowedSerialIds = InventoryMovement::query()
                        ->where('reference_type', InventoryTransfer::class)
                        ->where('reference_id', $transfer->id)
                        ->where('movement_type', InventoryMovementType::TransferOut)
                        ->where('product_variant_id', $item->product_variant_id)
                        ->whereNotNull('serial_id')
                        ->pluck('serial_id')
                        ->map(fn ($id) => (int) $id)
                        ->unique()
                        ->values()
                        ->all();

                    $serialCandidates['receive'][$item->id] = ProductSerial::query()
                        ->whereIn('id', $allowedSerialIds)
                        ->where('status', ProductSerialStatus::InTransit)
                        ->orderBy('serial_number')
                        ->get(['id', 'serial_number'])
                        ->map(fn (ProductSerial $serial) => [
                            'id' => $serial->id,
                            'serial_number' => $serial->serial_number,
                        ])
                        ->values()
                        ->all();
                }
            }
        }

        return Inertia::render('inventory/transfers/index', [
            'transfers' => InventoryTransferResource::collection($transfers),
            'warehouses' => WarehouseResource::collection(Warehouse::query()->orderBy('name')->get()),
            'variants' => ProductVariantResource::collection(
                ProductVariant::query()->with('product')->where('is_active', true)->orderBy('sku')->get()
            ),
            'serial_candidates' => $serialCandidates,
            'filters' => $request->only(['status', 'from_warehouse_id', 'to_warehouse_id', 'search']),
        ]);
    }

    public function store(StoreInventoryTransferRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request) {
            $transfer = InventoryTransfer::create([
                'code' => 'TRF-'.strtoupper(Str::random(8)),
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'status' => InventoryTransferStatus::Draft,
                'requested_by' => $request->user()?->id,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                InventoryTransferItem::create([
                    'inventory_transfer_id' => $transfer->id,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'received_quantity' => 0,
                ]);
            }
        });

        return redirect()->route('admin.inventory.transfers.index')
            ->with('success', 'Transferencia creada en borrador.');
    }

    public function update(UpdateInventoryTransferRequest $request, InventoryTransfer $inventoryTransfer): RedirectResponse
    {
        if ($inventoryTransfer->status !== InventoryTransferStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede editar una transferencia en borrador.',
            ]);
        }

        $data = $request->validated();

        DB::transaction(function () use ($data, $inventoryTransfer) {
            $inventoryTransfer->update([
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'notes' => $data['notes'] ?? null,
            ]);

            $inventoryTransfer->items()->delete();

            foreach ($data['items'] as $item) {
                InventoryTransferItem::create([
                    'inventory_transfer_id' => $inventoryTransfer->id,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'received_quantity' => 0,
                ]);
            }
        });

        return redirect()->route('admin.inventory.transfers.index')
            ->with('success', 'Transferencia actualizada.');
    }

    public function send(InventoryTransfer $inventoryTransfer, Request $request): RedirectResponse
    {
        if ($inventoryTransfer->status !== InventoryTransferStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede enviar una transferencia en borrador.',
            ]);
        }

        DB::transaction(function () use ($inventoryTransfer, $request) {
            $inventoryTransfer->load(['items', 'fromWarehouse']);

            $selectedSerialsByItem = collect($request->input('items', []))
                ->keyBy(fn (array $item) => (int) ($item['id'] ?? 0))
                ->map(
                    fn (array $item) => collect($item['serial_ids'] ?? [])
                        ->map(fn ($id) => (int) $id)
                        ->filter()
                        ->unique()
                        ->values()
                );

            $variantsById = ProductVariant::query()
                ->with('product')
                ->whereIn('id', $inventoryTransfer->items->pluck('product_variant_id')->all())
                ->get()
                ->keyBy('id');

            $fromWarehouse = Warehouse::query()
                ->lockForUpdate()
                ->findOrFail($inventoryTransfer->from_warehouse_id);

            foreach ($inventoryTransfer->items as $item) {
                $stock = InventoryStock::query()
                    ->where('warehouse_id', $fromWarehouse->id)
                    ->where('product_variant_id', $item->product_variant_id)
                    ->lockForUpdate()
                    ->first();

                $available = (float) ($stock?->available_quantity ?? 0);
                $itemQuantity = (float) $item->quantity;
                $variant = $variantsById->get($item->product_variant_id);
                $isSerialized = (bool) $variant?->product?->has_serial_numbers;
                $serials = collect();

                if ($available < $itemQuantity) {
                    throw ValidationException::withMessages([
                        'items' => "Stock insuficiente para la variante {$item->product_variant_id}.",
                    ]);
                }

                if ($isSerialized) {
                    $selectedSerialIds = $selectedSerialsByItem->get($item->id, collect());

                    if ($selectedSerialIds->count() !== (int) $itemQuantity) {
                        throw ValidationException::withMessages([
                            'items' => "Debes seleccionar exactamente {$itemQuantity} serial(es) para la variante {$item->product_variant_id}.",
                        ]);
                    }

                    if ($itemQuantity !== (float) (int) $itemQuantity) {
                        throw ValidationException::withMessages([
                            'items' => "La cantidad para la variante serializada {$item->product_variant_id} debe ser entera.",
                        ]);
                    }

                    $serials = ProductSerial::query()
                        ->whereIn('id', $selectedSerialIds->all())
                        ->where('product_variant_id', $item->product_variant_id)
                        ->where('warehouse_id', $fromWarehouse->id)
                        ->where('status', ProductSerialStatus::Available)
                        ->lockForUpdate()
                        ->get();

                    if ($serials->count() !== (int) $itemQuantity) {
                        throw ValidationException::withMessages([
                            'items' => "Los seriales seleccionados no son válidos para la variante {$item->product_variant_id}.",
                        ]);
                    }
                }

                $stock->quantity = (float) $stock->quantity - $itemQuantity;
                $stock->available_quantity = $available - $itemQuantity;
                $stock->save();

                if ($isSerialized) {
                    ProductSerial::query()
                        ->whereIn('id', $serials->pluck('id')->all())
                        ->update([
                            'status' => ProductSerialStatus::InTransit,
                            'warehouse_id' => null,
                        ]);

                    foreach ($serials as $serial) {
                        InventoryMovement::create([
                            'movement_type' => InventoryMovementType::TransferOut,
                            'reference_type' => InventoryTransfer::class,
                            'reference_id' => $inventoryTransfer->id,
                            'branch_id' => $fromWarehouse->branch_id,
                            'warehouse_id' => $fromWarehouse->id,
                            'product_variant_id' => $item->product_variant_id,
                            'serial_id' => $serial->id,
                            'quantity' => 1,
                            'unit_cost' => null,
                            'balance_after_movement' => $stock->quantity,
                            'notes' => 'Salida por transferencia '.$inventoryTransfer->code.' · Serial '.$serial->serial_number,
                            'user_id' => $request->user()?->id,
                        ]);
                    }

                    continue;
                }

                InventoryMovement::create([
                    'movement_type' => InventoryMovementType::TransferOut,
                    'reference_type' => InventoryTransfer::class,
                    'reference_id' => $inventoryTransfer->id,
                    'branch_id' => $fromWarehouse->branch_id,
                    'warehouse_id' => $fromWarehouse->id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $itemQuantity,
                    'unit_cost' => null,
                    'balance_after_movement' => $stock->quantity,
                    'notes' => 'Salida por transferencia '.$inventoryTransfer->code,
                    'user_id' => $request->user()?->id,
                ]);
            }

            $inventoryTransfer->update([
                'status' => InventoryTransferStatus::Sent,
                'approved_by' => $request->user()?->id,
                'sent_at' => now(),
            ]);
        });

        return redirect()->route('admin.inventory.transfers.index')
            ->with('success', 'Transferencia enviada.');
    }

    public function receive(ReceiveInventoryTransferRequest $request, InventoryTransfer $inventoryTransfer): RedirectResponse
    {
        if ($inventoryTransfer->status !== InventoryTransferStatus::Sent) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede recibir una transferencia enviada.',
            ]);
        }

        $receivedByItem = collect($request->validated('items'))
            ->keyBy('id')
            ->map(fn (array $item) => (float) $item['received_quantity']);

        $selectedSerialsByItem = collect($request->input('items', []))
            ->keyBy(fn (array $item) => (int) ($item['id'] ?? 0))
            ->map(
                fn (array $item) => collect($item['serial_ids'] ?? [])
                    ->map(fn ($id) => (int) $id)
                    ->filter()
                    ->unique()
                    ->values()
            );

        DB::transaction(function () use ($inventoryTransfer, $receivedByItem, $selectedSerialsByItem, $request) {
            $inventoryTransfer->load(['items', 'toWarehouse']);

            $variantsById = ProductVariant::query()
                ->with('product')
                ->whereIn('id', $inventoryTransfer->items->pluck('product_variant_id')->all())
                ->get()
                ->keyBy('id');

            $toWarehouse = Warehouse::query()
                ->lockForUpdate()
                ->findOrFail($inventoryTransfer->to_warehouse_id);

            foreach ($inventoryTransfer->items as $item) {
                $receivedQuantity = $receivedByItem->has($item->id)
                    ? $receivedByItem->get($item->id)
                    : (float) $item->quantity;

                if ($receivedQuantity < 0 || $receivedQuantity > (float) $item->quantity) {
                    throw ValidationException::withMessages([
                        'items' => "Cantidad recibida inválida para el item {$item->id}.",
                    ]);
                }

                $variant = $variantsById->get($item->product_variant_id);
                $isSerialized = (bool) $variant?->product?->has_serial_numbers;
                $serials = collect();

                if ($isSerialized && $receivedQuantity !== (float) (int) $receivedQuantity) {
                    throw ValidationException::withMessages([
                        'items' => "La cantidad recibida para la variante serializada {$item->product_variant_id} debe ser entera.",
                    ]);
                }

                if ($isSerialized) {
                    $selectedSerialIds = $selectedSerialsByItem->get($item->id, collect());

                    if ($selectedSerialIds->count() !== (int) $receivedQuantity) {
                        throw ValidationException::withMessages([
                            'items' => "Debes seleccionar exactamente {$receivedQuantity} serial(es) para recibir la variante {$item->product_variant_id}.",
                        ]);
                    }
                }

                $item->update([
                    'received_quantity' => $receivedQuantity,
                ]);

                if ($receivedQuantity <= 0) {
                    continue;
                }

                $stock = InventoryStock::query()
                    ->where('warehouse_id', $toWarehouse->id)
                    ->where('product_variant_id', $item->product_variant_id)
                    ->lockForUpdate()
                    ->first();

                if (! $stock) {
                    $stock = InventoryStock::create([
                        'warehouse_id' => $toWarehouse->id,
                        'product_variant_id' => $item->product_variant_id,
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'available_quantity' => 0,
                        'average_cost' => 0,
                    ]);
                }

                $stock->quantity = (float) $stock->quantity + $receivedQuantity;
                $stock->available_quantity = (float) $stock->available_quantity + $receivedQuantity;
                $stock->save();

                if ($isSerialized) {
                    $allowedSerialIds = InventoryMovement::query()
                        ->where('reference_type', InventoryTransfer::class)
                        ->where('reference_id', $inventoryTransfer->id)
                        ->where('movement_type', InventoryMovementType::TransferOut)
                        ->where('product_variant_id', $item->product_variant_id)
                        ->whereNotNull('serial_id')
                        ->pluck('serial_id')
                        ->map(fn ($id) => (int) $id)
                        ->unique()
                        ->values();

                    $selectedSerialIds = $selectedSerialsByItem->get($item->id, collect());

                    $serials = ProductSerial::query()
                        ->whereIn('id', $selectedSerialIds->all())
                        ->whereIn('id', $allowedSerialIds->all())
                        ->where('product_variant_id', $item->product_variant_id)
                        ->where('status', ProductSerialStatus::InTransit)
                        ->lockForUpdate()
                        ->get();

                    if ($serials->count() !== (int) $receivedQuantity) {
                        throw ValidationException::withMessages([
                            'items' => "Los seriales seleccionados no son válidos para recibir la variante {$item->product_variant_id}.",
                        ]);
                    }

                    ProductSerial::query()
                        ->whereIn('id', $serials->pluck('id')->all())
                        ->update([
                            'status' => ProductSerialStatus::Available,
                            'warehouse_id' => $toWarehouse->id,
                        ]);

                    foreach ($serials as $serial) {
                        InventoryMovement::create([
                            'movement_type' => InventoryMovementType::TransferIn,
                            'reference_type' => InventoryTransfer::class,
                            'reference_id' => $inventoryTransfer->id,
                            'branch_id' => $toWarehouse->branch_id,
                            'warehouse_id' => $toWarehouse->id,
                            'product_variant_id' => $item->product_variant_id,
                            'serial_id' => $serial->id,
                            'quantity' => 1,
                            'unit_cost' => null,
                            'balance_after_movement' => $stock->quantity,
                            'notes' => 'Ingreso por transferencia '.$inventoryTransfer->code.' · Serial '.$serial->serial_number,
                            'user_id' => $request->user()?->id,
                        ]);
                    }

                    continue;
                }

                InventoryMovement::create([
                    'movement_type' => InventoryMovementType::TransferIn,
                    'reference_type' => InventoryTransfer::class,
                    'reference_id' => $inventoryTransfer->id,
                    'branch_id' => $toWarehouse->branch_id,
                    'warehouse_id' => $toWarehouse->id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $receivedQuantity,
                    'unit_cost' => null,
                    'balance_after_movement' => $stock->quantity,
                    'notes' => 'Ingreso por transferencia '.$inventoryTransfer->code,
                    'user_id' => $request->user()?->id,
                ]);
            }

            $inventoryTransfer->update([
                'status' => InventoryTransferStatus::Received,
                'received_by' => $request->user()?->id,
                'received_at' => now(),
            ]);
        });

        return redirect()->route('admin.inventory.transfers.index')
            ->with('success', 'Transferencia recibida.');
    }

    public function destroy(InventoryTransfer $inventoryTransfer): RedirectResponse
    {
        if ($inventoryTransfer->status !== InventoryTransferStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede eliminar una transferencia en borrador.',
            ]);
        }

        $inventoryTransfer->delete();

        return redirect()->route('admin.inventory.transfers.index')
            ->with('success', 'Transferencia eliminada.');
    }
}
