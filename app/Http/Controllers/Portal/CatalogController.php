<?php

namespace App\Http\Controllers\Portal;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Portal\PortalProductResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()?->id;

        $products = Product::with(['brand', 'category', 'variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')])
            ->where('status', ProductStatus::Active)
            ->when($request->string('search')->isNotEmpty(), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('brand_id'), fn ($q) => $q->where('brand_id', $request->integer('brand_id')))
            ->when($request->filled('category_slug'), fn ($q) => $q->whereHas('category', fn ($sq) => $sq->where('slug', $request->input('category_slug'))))
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
            'filters' => $request->only(['search', 'brand_id', 'category_slug']),
        ]);
    }

    public function show(Product $product): Response
    {
        abort_if($product->status !== ProductStatus::Active, 404);

        $product->load(['brand', 'category', 'attributeValues.attribute', 'variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')]);

        $userId = request()->user()?->id;
        $inWishlist = $userId
            ? Wishlist::where('user_id', $userId)->where('product_id', $product->id)->exists()
            : false;

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
