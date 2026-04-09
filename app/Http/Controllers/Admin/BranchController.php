<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBranchRequest;
use App\Http\Requests\Admin\UpdateBranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(): Response
    {
        $branches = Branch::query()
            ->withCount('warehouses')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('inventory/branches/index', [
            'branches' => BranchResource::collection($branches),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/branches/create');
    }

    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;

        Branch::create($data);

        return redirect()->route('admin.branches.index')->with('success', 'Sucursal creada exitosamente.');
    }

    public function edit(Branch $branch): Response
    {
        return Inertia::render('inventory/branches/edit', [
            'branch' => BranchResource::make($branch),
        ]);
    }

    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? $branch->is_active;

        $branch->update($data);

        return redirect()->route('admin.branches.index')->with('success', 'Sucursal actualizada.');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        if ($branch->warehouses()->exists()) {
            return redirect()->route('admin.branches.index')->with('error', 'No puedes eliminar una sucursal con bodegas asociadas.');
        }

        $branch->delete();

        return redirect()->route('admin.branches.index')->with('success', 'Sucursal eliminada.');
    }
}
