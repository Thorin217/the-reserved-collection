<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVendorRequest;
use App\Http\Requests\Admin\UpdateVendorRequest;
use App\Http\Resources\AccountPayableResource;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class VendorController extends Controller
{
    public function index(Request $request): Response
    {
        $vendors = QueryBuilder::for(Vendor::class)
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value): void {
                    $query->where(function ($innerQuery) use ($value): void {
                        $innerQuery
                            ->where('name', 'like', "%{$value}%")
                            ->orWhere('email', 'like', "%{$value}%")
                            ->orWhere('tax_id', 'like', "%{$value}%");
                    });
                }),
            )
            ->withCount('payables')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('finance/vendors/index', [
            'vendors' => VendorResource::collection($vendors),
            'metrics' => [
                'total_count' => Vendor::query()->count(),
                'active_count' => Vendor::query()->where('is_active', true)->count(),
            ],
            'filters' => $request->only(['filter']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('finance/vendors/create');
    }

    public function store(StoreVendorRequest $request): RedirectResponse
    {
        $vendor = Vendor::create($request->validated());

        return redirect()
            ->route('admin.finance.vendors.show', $vendor)
            ->with('success', 'Vendor created successfully.');
    }

    public function show(Vendor $vendor): Response
    {
        $vendor->loadCount('payables');
        $vendor->load([
            'payables' => fn ($query) => $query
                ->with(['payments'])
                ->orderByRaw('due_date is null, due_date asc')
                ->latest('id'),
        ]);

        return Inertia::render('finance/vendors/show', [
            'vendor' => VendorResource::make($vendor),
            'payables' => AccountPayableResource::collection($vendor->payables),
        ]);
    }

    public function edit(Vendor $vendor): Response
    {
        return Inertia::render('finance/vendors/edit', [
            'vendor' => VendorResource::make($vendor),
        ]);
    }

    public function update(UpdateVendorRequest $request, Vendor $vendor): RedirectResponse
    {
        $vendor->update($request->validated());

        return redirect()
            ->route('admin.finance.vendors.show', $vendor)
            ->with('success', 'Vendor updated successfully.');
    }

    public function destroy(Vendor $vendor): RedirectResponse
    {
        $vendor->delete();

        return redirect()
            ->route('admin.finance.vendors.index')
            ->with('success', 'Vendor deleted successfully.');
    }
}
