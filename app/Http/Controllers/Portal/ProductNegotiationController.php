<?php

namespace App\Http\Controllers\Portal;

use App\Enums\ProductNegotiationMessageType;
use App\Enums\ProductNegotiationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductNegotiationResource;
use App\Models\Product;
use App\Models\ProductNegotiation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductNegotiationController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        $user = $request->user();

        if (! $user->is_collector_verified) {
            return back()->with('error', 'You must be a verified collector to negotiate prices.');
        }

        $hasOpen = $user->productNegotiations()
            ->where('product_id', $product->id)
            ->whereIn('status', [ProductNegotiationStatus::Pending, ProductNegotiationStatus::Active])
            ->exists();

        if ($hasOpen) {
            return back()->with('error', 'You already have an open negotiation for this product.');
        }

        $request->validate([
            'product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'initial_offer' => ['required', 'numeric', 'min:0'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $negotiation = $user->productNegotiations()->create([
            'product_id' => $product->id,
            'product_variant_id' => $request->product_variant_id,
            'status' => ProductNegotiationStatus::Pending,
            'initial_offer' => $request->initial_offer,
            'notes' => $request->message,
        ]);

        if ($request->filled('message')) {
            $negotiation->messages()->create([
                'user_id' => $user->id,
                'type' => ProductNegotiationMessageType::Offer,
                'amount' => $request->initial_offer,
                'message' => $request->message,
            ]);
        }

        return redirect()->route('portal.negotiations.show', $negotiation)
            ->with('success', 'Your negotiation request has been submitted.');
    }

    public function show(Request $request, ProductNegotiation $productNegotiation): Response
    {
        abort_if($productNegotiation->user_id !== $request->user()->id, 403);

        $productNegotiation->load([
            'product.brand',
            'product.category',
            'variant',
            'messages' => fn ($q) => $q->with('user')->oldest(),
        ]);

        return Inertia::render('portal/negotiations/show', [
            'negotiation' => ProductNegotiationResource::make($productNegotiation),
        ]);
    }

    public function storeMessage(Request $request, ProductNegotiation $productNegotiation): RedirectResponse
    {
        abort_if($productNegotiation->user_id !== $request->user()->id, 403);
        abort_if(! $productNegotiation->isOpen(), 403, 'This negotiation is no longer active.');

        $request->validate([
            'amount' => ['nullable', 'numeric', 'min:0'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $productNegotiation->messages()->create([
            'user_id' => $request->user()->id,
            'type' => $request->filled('amount') ? ProductNegotiationMessageType::CounterOffer : ProductNegotiationMessageType::Note,
            'amount' => $request->amount,
            'message' => $request->message,
        ]);

        if ($productNegotiation->status === ProductNegotiationStatus::Pending) {
            $productNegotiation->update(['status' => ProductNegotiationStatus::Active]);
        }

        return back()->with('success', 'Message sent.');
    }
}
