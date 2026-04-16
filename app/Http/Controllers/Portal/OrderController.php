<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $client = $request->user()->client;

        $orders = Sale::query()
            ->with(['items.productVariant.product', 'items.productVariant.product.brand'])
            ->when($client !== null, fn ($query) => $query->where('client_id', $client->id))
            ->latest()
            ->get();

        return Inertia::render('portal/orders/index', [
            'orders' => SaleResource::collection($orders),
        ]);
    }

    public function show(Request $request, Sale $sale): Response
    {
        $client = $request->user()->client;

        abort_if($client === null || $sale->client_id !== $client->id, 403);

        $sale->load([
            'items.productVariant.product.brand',
            'receivables',
        ]);

        return Inertia::render('portal/orders/show', [
            'order' => SaleResource::make($sale),
        ]);
    }
}
