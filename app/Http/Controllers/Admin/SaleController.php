<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Finance\ConfirmSale;
use App\Actions\Finance\SaveSale;
use App\Enums\SaleStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSaleRequest;
use App\Http\Requests\Admin\UpdateSaleRequest;
use App\Http\Resources\ClientResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\SaleResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Client;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Sale::class);

        $sales = QueryBuilder::for(Sale::class)
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value): void {
                    $query->where(function ($innerQuery) use ($value): void {
                        $innerQuery
                            ->where('sale_number', 'like', "%{$value}%")
                            ->orWhereHas('client', fn ($clientQuery) => $clientQuery->where('name', 'like', "%{$value}%"));
                    });
                }),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('user_id'),
            )
            ->with(['client', 'warehouse', 'user', 'quote', 'negotiation'])
            ->latest('sold_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('finance/sales/index', [
            'sales' => SaleResource::collection($sales),
            'users' => UserResource::collection(User::query()->orderBy('name')->get()),
            'metrics' => [
                'draft_count' => Sale::query()->where('status', SaleStatus::Draft)->count(),
                'confirmed_count' => Sale::query()->where('status', SaleStatus::Confirmed)->count(),
                'total_value' => (float) Sale::query()->sum('total'),
                'pending_balance' => (float) Sale::query()->sum('balance_due'),
            ],
            'filters' => $request->only(['filter']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Sale::class);

        return Inertia::render('finance/sales/create', $this->formOptions());
    }

    public function store(StoreSaleRequest $request, SaveSale $saveSale): RedirectResponse
    {
        $sale = $saveSale->handle($request->validated(), $request->user());

        return redirect()
            ->route('admin.finance.sales.edit', $sale)
            ->with('success', 'Sale created successfully.');
    }

    public function show(Request $request, Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $sale->load([
            'client',
            'lead.client',
            'quote',
            'negotiation',
            'warehouse',
            'user',
            'items.productVariant.product.brand',
            'items.productSerial',
            'receivables',
        ]);

        return Inertia::render('finance/sales/show', [
            'sale' => SaleResource::make($sale),
            'can' => [
                'update' => $request->user()?->can('update', $sale) ?? false,
                'confirm' => $request->user()?->can('confirm', $sale) ?? false,
                'cancel' => $request->user()?->can('cancel', $sale) ?? false,
            ],
        ]);
    }

    public function edit(Sale $sale): Response
    {
        $this->authorize('update', $sale);

        $sale->load([
            'client',
            'lead.client',
            'quote',
            'negotiation',
            'warehouse',
            'user',
            'items.productVariant.product.brand',
            'items.productSerial',
        ]);

        return Inertia::render('finance/sales/edit', [
            'sale' => SaleResource::make($sale),
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateSaleRequest $request, Sale $sale, SaveSale $saveSale): RedirectResponse
    {
        $this->authorize('update', $sale);

        $sale = $saveSale->handle($request->validated(), $request->user(), $sale);

        return redirect()
            ->route('admin.finance.sales.edit', $sale)
            ->with('success', 'Sale updated successfully.');
    }

    public function confirm(Sale $sale, ConfirmSale $confirmSale): RedirectResponse
    {
        $this->authorize('confirm', $sale);

        if ($sale->warehouse_id === null) {
            throw ValidationException::withMessages([
                'sale' => 'Assign a warehouse before confirming the sale.',
            ]);
        }

        if (! $sale->items()->exists()) {
            throw ValidationException::withMessages([
                'sale' => 'Add at least one item before confirming the sale.',
            ]);
        }

        $confirmSale->handle($sale);

        return redirect()
            ->route('admin.finance.sales.show', $sale)
            ->with('success', 'Sale confirmed successfully.');
    }

    public function invoice(Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $sale->load([
            'client',
            'warehouse',
            'user',
            'items.productVariant.product.brand',
        ]);

        return Inertia::render('finance/sales/invoice', [
            'sale' => SaleResource::make($sale),
        ]);
    }

    public function cancel(Sale $sale): RedirectResponse
    {
        $this->authorize('cancel', $sale);

        $sale->forceFill([
            'status' => SaleStatus::Cancelled,
        ])->save();

        return redirect()
            ->route('admin.finance.sales.show', $sale)
            ->with('success', 'Sale cancelled successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'clients' => ClientResource::collection(
                Client::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get()
            ),
            'warehouses' => WarehouseResource::collection(
                Warehouse::query()
                    ->where('is_active', true)
                    ->where('allows_sales', true)
                    ->orderBy('name')
                    ->get()
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
