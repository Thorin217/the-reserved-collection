<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductNegotiationMessageType;
use App\Enums\ProductNegotiationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductNegotiationResource;
use App\Models\ProductNegotiation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProductNegotiationController extends Controller
{
    public function index(Request $request): Response
    {
        $negotiations = QueryBuilder::for(ProductNegotiation::class)
            ->allowedFilters(
                AllowedFilter::exact('status'),
            )
            ->with(['user', 'product.brand'])
            ->withCount('messages')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/product-negotiations/index', [
            'negotiations' => ProductNegotiationResource::collection($negotiations),
            'filters' => $request->only(['filter']),
        ]);
    }

    public function show(ProductNegotiation $productNegotiation): Response
    {
        $productNegotiation->load([
            'user',
            'product.brand',
            'product.category',
            'variant',
            'messages' => fn ($q) => $q->with('user')->oldest(),
        ]);

        return Inertia::render('admin/product-negotiations/show', [
            'negotiation' => ProductNegotiationResource::make($productNegotiation),
        ]);
    }

    public function update(Request $request, ProductNegotiation $productNegotiation): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,active,agreed,rejected,cancelled'],
            'final_price' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $data = $request->only(['status', 'final_price', 'notes']);

        if ($request->status === 'agreed' && $productNegotiation->agreed_at === null) {
            $data['agreed_at'] = now();
        }

        $productNegotiation->update($data);

        return back()->with('success', 'Negotiation updated.');
    }

    public function storeMessage(Request $request, ProductNegotiation $productNegotiation): RedirectResponse
    {
        abort_if(! $productNegotiation->isOpen() && $request->type !== 'note', 422, 'Negotiation is closed.');

        $request->validate([
            'type' => ['required', 'in:offer,counter_offer,note'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $productNegotiation->messages()->create([
            'user_id' => $request->user()->id,
            'type' => ProductNegotiationMessageType::from($request->type),
            'amount' => $request->amount,
            'message' => $request->message,
        ]);

        if ($productNegotiation->status === ProductNegotiationStatus::Pending) {
            $productNegotiation->update(['status' => ProductNegotiationStatus::Active]);
        }

        return back()->with('success', 'Message sent.');
    }
}
