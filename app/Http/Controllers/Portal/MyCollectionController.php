<?php

namespace App\Http\Controllers\Portal;

use App\Enums\SaleStatus;
use App\Enums\ServiceType;
use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyCollectionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $client = $user->client;

        $collectionItems = [];

        if ($client !== null) {
            $sales = Sale::query()
                ->where('client_id', $client->id)
                ->where('status', SaleStatus::Confirmed)
                ->with([
                    'items.productVariant.product.brand',
                    'items.serviceRequests' => fn ($q) => $q->latest(),
                ])
                ->latest('sold_at')
                ->get();

            foreach ($sales as $sale) {
                foreach ($sale->items as $item) {
                    $product = $item->productVariant?->product;
                    $collectionItems[] = [
                        'sale_item_id' => $item->id,
                        'sale_id' => $sale->id,
                        'sale_number' => $sale->sale_number,
                        'sold_at' => $sale->sold_at?->toDateString(),
                        'name' => $product?->name ?? $item->description,
                        'brand' => $product?->brand?->name,
                        'unit_price' => (float) $item->unit_price,
                        'image_url' => $item->productVariant?->getFirstMediaUrl('product-variant')
                            ?: $product?->getFirstMediaUrl('product')
                            ?: null,
                        'product_slug' => $product?->slug,
                        'service_requests' => ServiceRequestResource::collection($item->serviceRequests)->resolve(),
                    ];
                }
            }
        }

        $serviceTypes = collect(ServiceType::cases())->map(fn (ServiceType $type) => [
            'value' => $type->value,
            'label' => $type->label(),
        ])->values()->all();

        return Inertia::render('portal/my-collection', [
            'collection_items' => $collectionItems,
            'service_types' => $serviceTypes,
        ]);
    }
}
