<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryMovementType;
use App\Enums\InventoryTransferStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReceiveInventoryTransferRequest;
use App\Http\Requests\Admin\StoreInventoryTransferRequest;
use App\Http\Requests\Admin\UpdateInventoryTransferRequest;
use App\Http\Resources\InventoryTransferResource;
use App\Http\Resources\WarehouseResource;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransferItem;
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
            ->with(['fromWarehouse', 'toWarehouse', 'requester', 'approver', 'receiver'])
            ->withCount('items')
            ->when($status, fn ($query) => $query->where('status', $status->value))
            ->when($request->from_warehouse_id, fn ($query, $fromWarehouseId) => $query->where('from_warehouse_id', $fromWarehouseId))
            ->when($request->to_warehouse_id, fn ($query, $toWarehouseId) => $query->where('to_warehouse_id', $toWarehouseId))
            ->when($request->search, fn ($query, $search) => $query->where('code', 'like', "%{$search}%"))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/transfers/index', [
            'transfers' => InventoryTransferResource::collection($transfers),
            'warehouses' => WarehouseResource::collection(Warehouse::query()->orderBy('name')->get()),
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

                if ($available < (float) $item->quantity) {
                    throw ValidationException::withMessages([
                        'items' => "Stock insuficiente para la variante {$item->product_variant_id}.",
                    ]);
                }

                $stock->quantity = (float) $stock->quantity - (float) $item->quantity;
                $stock->available_quantity = $available - (float) $item->quantity;
                $stock->save();

                InventoryMovement::create([
                    'movement_type' => InventoryMovementType::TransferOut,
                    'reference_type' => InventoryTransfer::class,
                    'reference_id' => $inventoryTransfer->id,
                    'branch_id' => $fromWarehouse->branch_id,
                    'warehouse_id' => $fromWarehouse->id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $item->quantity,
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

        DB::transaction(function () use ($inventoryTransfer, $receivedByItem, $request) {
            $inventoryTransfer->load(['items', 'toWarehouse']);

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
