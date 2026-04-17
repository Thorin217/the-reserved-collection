<?php

namespace App\Http\Controllers\Portal;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = $request->string('q')->trim();
        $page = max(1, $request->integer('page', 1));

        if ($q->isEmpty() || mb_strlen((string) $q) < 2) {
            return response()->json([
                'data' => [],
                'meta' => ['total' => 0, 'current_page' => 1, 'last_page' => 1, 'per_page' => 6],
            ]);
        }

        $products = Product::with([
            'brand',
            'category',
            'variants' => fn ($q) => $q->where('is_active', true)->orderBy('price'),
        ])
            ->where('status', ProductStatus::Active)
            ->where(function ($query) use ($q): void {
                $query->where('name', 'like', '%'.$q.'%')
                    ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', '%'.$q.'%'))
                    ->orWhere('sku', 'like', '%'.$q.'%');
            })
            ->latest()
            ->paginate(6, ['*'], 'page', $page);

        return response()->json([
            'data' => $products->getCollection()->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'image_url' => $p->getFirstMediaUrl('product'),
                'brand' => $p->brand?->name,
                'category' => $p->category?->name,
                'price' => $p->variants->first()?->price,
            ])->values(),
            'meta' => [
                'total' => $products->total(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
            ],
        ]);
    }
}
