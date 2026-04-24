<?php

namespace App\Http\Controllers\Portal;

use App\Enums\ProductNegotiationStatus;
use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Portal\PortalProductResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\CollectorVerificationRequest;
use App\Models\Product;
use App\Models\ProductNegotiation;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()?->id;

        // Base constraints shared by both the product query and the attribute filter query.
        $baseConstraints = function ($q) use ($request): void {
            $q->where('status', ProductStatus::Active)
                ->when($request->string('search')->isNotEmpty(), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
                ->when($request->filled('brand_id'), fn ($q) => $q->where('brand_id', $request->integer('brand_id')))
                ->when($request->filled('category_slug'), fn ($q) => $q->whereHas('category', fn ($sq) => $sq->where('slug', $request->input('category_slug'))));
        };

        // Product IDs matching base filters (used as subquery for attribute filter options).
        $baseProductIds = Product::query()->tap($baseConstraints)->select('id');

        // Filterable attributes with their distinct values for products in the current scope.
        $attributeFilters = DB::table('product_attribute_values as pav')
            ->join('attributes as a', 'a.id', '=', 'pav.attribute_id')
            ->whereIn('pav.product_id', $baseProductIds)
            ->where('a.is_filterable', true)
            ->where('a.is_active', true)
            ->whereNotNull('pav.value_text')
            ->select('a.code', 'a.name', 'a.sort_order', 'pav.value_text')
            ->distinct()
            ->orderBy('a.sort_order')
            ->orderBy('pav.value_text')
            ->get()
            ->groupBy('code')
            ->map(fn ($group) => [
                'code' => $group->first()->code,
                'name' => $group->first()->name,
                'values' => $group->pluck('value_text')->values(),
            ])
            ->values();

        // Full product query including optional attribute value filters.
        $products = Product::with(['brand', 'category', 'variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')])
            ->tap($baseConstraints)
            ->when($request->filled('attrs'), function ($q) use ($request): void {
                foreach ($request->input('attrs', []) as $code => $value) {
                    if ($value) {
                        $q->whereHas('attributeValues', fn ($sq) => $sq
                            ->whereHas('attribute', fn ($a) => $a->where('code', $code))
                            ->where('value_text', $value)
                        );
                    }
                }
            })
            ->latest()
            ->paginate(16)
            ->withQueryString();

        $wishlistIds = $userId
            ? Wishlist::where('user_id', $userId)->pluck('product_id')->all()
            : [];

        return Inertia::render('portal/catalog', [
            'products' => PortalProductResource::collection($products),
            'brands' => Brand::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'categories' => Category::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'wishlistIds' => $wishlistIds,
            'attributeFilters' => $attributeFilters,
            'filters' => $request->only(['search', 'brand_id', 'category_slug', 'attrs']),
        ]);
    }

    public function show(Product $product): Response
    {
        abort_if($product->status !== ProductStatus::Active, 404);

        $product->load(['brand', 'category', 'attributeValues.attribute', 'variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')]);

        $user = request()->user();
        $userId = $user?->id;

        $inWishlist = $userId
            ? Wishlist::where('user_id', $userId)->where('product_id', $product->id)->exists()
            : false;

        $collectorStatus = null;
        $activeNegotiation = null;

        if ($userId) {
            if ($user->is_collector_verified) {
                $collectorStatus = 'verified';

                $openNegotiation = ProductNegotiation::where('user_id', $userId)
                    ->where('product_id', $product->id)
                    ->whereIn('status', [ProductNegotiationStatus::Pending, ProductNegotiationStatus::Active])
                    ->first(['id', 'status', 'initial_offer', 'created_at']);

                if ($openNegotiation) {
                    $activeNegotiation = [
                        'id' => $openNegotiation->id,
                        'status' => $openNegotiation->status->value,
                        'initial_offer' => $openNegotiation->initial_offer,
                        'created_at' => $openNegotiation->created_at,
                    ];
                }
            } else {
                $latestRequest = CollectorVerificationRequest::where('user_id', $userId)
                    ->latest()
                    ->first(['status', 'admin_notes', 'reviewed_at']);

                $collectorStatus = $latestRequest?->status->value ?? 'none';
            }
        }

        $related = Product::with(['brand', 'variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')])
            ->where('status', 'active')
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(4)
            ->get();

        return Inertia::render('portal/show', [
            'product' => PortalProductResource::make($product),
            'inWishlist' => $inWishlist,
            'related' => PortalProductResource::collection($related)->resolve(),
            'collectorStatus' => $collectorStatus,
            'activeNegotiation' => $activeNegotiation,
        ]);
    }

    public function featured(): Response
    {
        $featured = Product::with(['brand', 'variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')])
            ->where('status', 'active')
            ->latest()
            ->take(8)
            ->get();

        $brands = Brand::where('is_active', true)
            ->withCount('products')
            ->orderByDesc('products_count')
            ->take(8)
            ->get(['id', 'name', 'slug']);

        return Inertia::render('portal/index', [
            'featured' => PortalProductResource::collection($featured)->resolve(),
            'brands' => $brands,
        ]);
    }
}
