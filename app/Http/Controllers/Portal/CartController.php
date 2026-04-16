<?php

namespace App\Http\Controllers\Portal;

use App\Actions\Finance\CreateSaleFromCart;
use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(Request $request): Response
    {
        $items = CartItem::with(['variant.product.brand', 'variant.product' => fn ($q) => $q->with('brand')])
            ->where('user_id', $request->user()->id)
            ->get();

        $cartData = $items->map(fn (CartItem $item) => [
            'id' => $item->id,
            'quantity' => $item->quantity,
            'variant' => [
                'id' => $item->variant->id,
                'sku' => $item->variant->sku,
                'price' => $item->variant->price,
                'compare_price' => $item->variant->compare_price,
                'attribute_summary' => $item->variant->attribute_summary,
            ],
            'product' => [
                'id' => $item->variant->product->id,
                'name' => $item->variant->product->name,
                'slug' => $item->variant->product->slug,
                'image_url' => $item->variant->product->getFirstMediaUrl('product'),
                'brand' => $item->variant->product->brand?->name,
            ],
        ]);

        return Inertia::render('portal/cart', [
            'cartItems' => $cartData,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $variant = ProductVariant::findOrFail($request->integer('product_variant_id'));

        CartItem::updateOrCreate(
            ['user_id' => $request->user()->id, 'product_variant_id' => $variant->id],
            ['quantity' => $request->integer('quantity', 1)]
        );

        return back()->with('success', 'Item added to cart.');
    }

    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        abort_if($cartItem->user_id !== $request->user()->id, 403);

        $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:10']]);

        $cartItem->update(['quantity' => $request->integer('quantity')]);

        return back();
    }

    public function destroy(Request $request, CartItem $cartItem): RedirectResponse
    {
        abort_if($cartItem->user_id !== $request->user()->id, 403);

        $cartItem->delete();

        return back()->with('success', 'Item removed from cart.');
    }

    public function checkout(Request $request, CreateSaleFromCart $createSaleFromCart): RedirectResponse
    {
        $sale = $createSaleFromCart->handle($request->user());

        return redirect()
            ->route('portal.orders.show', $sale)
            ->with('success', 'Order created successfully. Our team will review it shortly.');
    }
}
