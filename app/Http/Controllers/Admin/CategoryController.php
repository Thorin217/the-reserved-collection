<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = Category::with('parent')
            ->withCount('products')
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
            ->when($request->parent_id, function ($query, $parentId) {
                if ($parentId === '_none') {
                    $query->whereNull('parent_id');

                    return;
                }

                $query->where('parent_id', $parentId);
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/categories/index', [
            'categories' => CategoryResource::collection($categories),
            'parents' => CategoryResource::collection(Category::whereNull('parent_id')->orderBy('name')->get()),
            'filters' => $request->only(['search', 'status', 'parent_id']),
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);
        $data['is_active'] = $data['is_active'] ?? true;

        Category::create($data);

        return redirect()->route('admin.categories.index')->with('success', 'Categoría creada exitosamente.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);
        $data['is_active'] = $data['is_active'] ?? $category->is_active;

        $category->update($data);

        return redirect()->route('admin.categories.index')->with('success', 'Categoría actualizada.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('admin.categories.index')->with('success', 'Categoría eliminada.');
    }
}
