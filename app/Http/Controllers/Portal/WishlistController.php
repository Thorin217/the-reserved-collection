<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Resources\Portal\PortalProductResource;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function index(Request $request): Response
    {
        $wishlistProductIds = Wishlist::where('user_id', $request->user()->id)
            ->pluck('product_id');

        $products = Product::with(['brand', 'variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')])
            ->whereIn('id', $wishlistProductIds)
            ->where('status', 'active')
            ->get();

        return Inertia::render('portal/wishlist', [
            'products' => PortalProductResource::collection($products),
            'wishlistIds' => $wishlistProductIds->all(),
        ]);
    }

    public function toggle(Request $request, Product $product): RedirectResponse
    {
        $userId = $request->user()->id;

        $existing = Wishlist::where('user_id', $userId)
            ->where('product_id', $product->id)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            Wishlist::create(['user_id' => $userId, 'product_id' => $product->id]);
        }

        return back();
    }
}
