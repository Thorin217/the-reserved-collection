<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Finance\ConfirmPurchase;
use App\Actions\Finance\SavePurchase;
use App\Enums\PurchaseStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePurchaseRequest;
use App\Http\Requests\Admin\UpdatePurchaseRequest;
use App\Http\Resources\ProductResource;
use App\Http\Resources\PurchaseResource;
use App\Http\Resources\VendorResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $purchases = QueryBuilder::for(Purchase::class)
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value): void {
                    $query->where(function ($inner) use ($value): void {
                        $inner
                            ->where('purchase_number', 'like', "%{$value}%")
                            ->orWhere('vendor_name', 'like', "%{$value}%")
                            ->orWhere('reference', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('status'),
            )
            ->with(['vendor', 'warehouse', 'user'])
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('finance/purchases/index', [
            'purchases' => PurchaseResource::collection($purchases),
            'metrics' => [
                'draft_count' => Purchase::query()->where('status', PurchaseStatus::Draft)->count(),
                'confirmed_count' => Purchase::query()->where('status', PurchaseStatus::Confirmed)->count(),
                'total_value' => (float) Purchase::query()->where('status', PurchaseStatus::Confirmed)->sum('total'),
                'pending_balance' => (float) Purchase::query()->where('status', PurchaseStatus::Confirmed)->sum('balance_due'),
            ],
            'filters' => $request->only(['filter']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('finance/purchases/create', $this->formOptions());
    }

    public function store(StorePurchaseRequest $request, SavePurchase $savePurchase): RedirectResponse
    {
        $purchase = $savePurchase->handle($request->validated(), $request->user());

        return redirect()
            ->route('admin.finance.purchases.edit', $purchase)
            ->with('success', 'Purchase created successfully.');
    }

    public function show(Purchase $purchase): Response
    {
        $purchase->load([
            'vendor',
            'warehouse',
            'user',
            'items.productVariant.product.brand',
            'payable.payments',
        ]);

        return Inertia::render('finance/purchases/show', [
            'purchase' => PurchaseResource::make($purchase),
        ]);
    }

    public function edit(Purchase $purchase): Response|RedirectResponse
    {
        if ($purchase->status === PurchaseStatus::Confirmed) {
            return redirect()->route('admin.finance.purchases.show', $purchase);
        }

        $purchase->load([
            'vendor',
            'warehouse',
            'user',
            'items.productVariant.product.brand',
        ]);

        return Inertia::render('finance/purchases/edit', [
            'purchase' => PurchaseResource::make($purchase),
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase, SavePurchase $savePurchase): RedirectResponse
    {
        if ($purchase->status === PurchaseStatus::Confirmed) {
            throw ValidationException::withMessages([
                'purchase' => 'Confirmed purchases cannot be edited.',
            ]);
        }

        $purchase = $savePurchase->handle($request->validated(), $request->user(), $purchase);

        return redirect()
            ->route('admin.finance.purchases.edit', $purchase)
            ->with('success', 'Purchase updated successfully.');
    }

    public function confirm(Purchase $purchase, ConfirmPurchase $confirmPurchase): RedirectResponse
    {
        if ($purchase->warehouse_id === null) {
            throw ValidationException::withMessages([
                'purchase' => 'Assign a warehouse before confirming the purchase.',
            ]);
        }

        if (! $purchase->items()->exists()) {
            throw ValidationException::withMessages([
                'purchase' => 'Add at least one item before confirming the purchase.',
            ]);
        }

        $confirmPurchase->handle($purchase);

        return redirect()
            ->route('admin.finance.purchases.show', $purchase)
            ->with('success', 'Purchase confirmed. Inventory updated and payable generated.');
    }

    public function cancel(Purchase $purchase): RedirectResponse
    {
        if ($purchase->status === PurchaseStatus::Confirmed) {
            throw ValidationException::withMessages([
                'purchase' => 'Confirmed purchases cannot be cancelled.',
            ]);
        }

        $purchase->forceFill(['status' => PurchaseStatus::Cancelled])->save();

        return redirect()
            ->route('admin.finance.purchases.show', $purchase)
            ->with('success', 'Purchase cancelled successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'vendors' => VendorResource::collection(
                Vendor::query()->where('is_active', true)->orderBy('name')->get()
            ),
            'warehouses' => WarehouseResource::collection(
                Warehouse::query()->where('is_active', true)->orderBy('name')->get()
            ),
            'products' => ProductResource::collection(
                Product::query()
                    ->with(['brand', 'variants'])
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get()
            ),
        ];
    }
}
