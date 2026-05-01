<?php

namespace App\Http\Controllers\Portal;

use App\Actions\Finance\CreateSaleFromCart;
use App\Http\Controllers\Controller;
use App\Models\CartItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $items = CartItem::query()
            ->with(['variant.product.brand'])
            ->where('user_id', $request->user()->id)
            ->get();

        if ($items->isEmpty()) {
            return redirect()->route('portal.cart');
        }

        $cartData = $items->map(fn (CartItem $item) => [
            'id' => $item->id,
            'quantity' => $item->quantity,
            'variant' => [
                'id' => $item->variant->id,
                'price' => $item->variant->price,
                'attribute_summary' => $item->variant->attribute_summary,
            ],
            'product' => [
                'name' => $item->variant->product->name,
                'brand' => $item->variant->product->brand?->name,
            ],
        ]);

        $subtotal = $items->sum(fn (CartItem $item) => (float) ($item->variant?->price ?? 0) * $item->quantity);

        return Inertia::render('portal/checkout', [
            'cartItems' => $cartData,
            'subtotal' => $subtotal,
        ]);
    }

    public function store(Request $request, CreateSaleFromCart $createSaleFromCart): RedirectResponse
    {
        $request->validate([
            'card_name' => ['required', 'string', 'max:100'],
            'card_number' => ['required', 'string'],
            'card_expiry' => ['required', 'string'],
            'card_cvv' => ['required', 'string'],
        ]);

        $sale = $createSaleFromCart->handle($request->user());

        return redirect()
            ->route('portal.orders.show', $sale)
            ->with('success', 'Order placed successfully. Our team will review and confirm it shortly.');
    }
}
