<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBrandRequest;
use App\Http\Requests\Admin\UpdateBrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(Request $request): Response
    {
        $brands = Brand::withCount('products')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->where('is_active', true);
                }

                if ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/brands/index', [
            'brands' => BrandResource::collection($brands),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(StoreBrandRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);
        $data['is_active'] = $data['is_active'] ?? true;

        Brand::create($data);

        return redirect()->route('admin.brands.index')->with('success', 'Marca creada exitosamente.');
    }

    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);
        $data['is_active'] = $data['is_active'] ?? $brand->is_active;

        $brand->update($data);

        return redirect()->route('admin.brands.index')->with('success', 'Marca actualizada.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        $brand->delete();

        return redirect()->route('admin.brands.index')->with('success', 'Marca eliminada.');
    }
}
