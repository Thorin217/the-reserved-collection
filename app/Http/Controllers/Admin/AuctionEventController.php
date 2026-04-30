<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Auctions\CreateAuctionEvent;
use App\Actions\Auctions\UpdateAuctionEvent;
use App\Enums\AuctionEventFormat;
use App\Enums\AuctionStatus;
use App\Enums\ProductSerialStatus;
use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAuctionEventRequest;
use App\Http\Resources\AuctionEventResource;
use App\Http\Resources\AuctionResource;
use App\Models\Auction;
use App\Models\AuctionEvent;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuctionEventController extends Controller
{
    public function index(Request $request): Response
    {
        $events = AuctionEvent::query()
            ->with(['creator'])
            ->withCount('auctions')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('format'), fn ($query) => $query->where('format', $request->string('format')))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($innerQuery) use ($search): void {
                    $innerQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('commercial/auction-events/index', [
            'events' => AuctionEventResource::collection($events),
            'filters' => $request->only(['status', 'format', 'search']),
            'statuses' => collect(AuctionStatus::cases())->map(fn (AuctionStatus $status) => [
                'value' => $status->value,
                'label' => ucfirst($status->value),
            ])->values(),
            'formats' => collect(AuctionEventFormat::cases())->map(fn (AuctionEventFormat $format) => [
                'value' => $format->value,
                'label' => str($format->value)->replace('_', ' ')->title()->toString(),
            ])->values(),
        ]);
    }

    public function create(): Response
    {
        return $this->renderEventForm();
    }

    public function store(
        StoreAuctionEventRequest $request,
        CreateAuctionEvent $createAuctionEvent,
    ): RedirectResponse {
        $event = $createAuctionEvent->handle($request->validated(), $request->user());

        return redirect()
            ->route('admin.auction-events.show', $event)
            ->with('success', 'Auction event created successfully.');
    }

    public function show(AuctionEvent $auctionEvent): Response
    {
        $auctionEvent->load([
            'creator',
            'closer',
            'auctions' => fn ($query) => $query
                ->with(['creator', 'winner', 'items.product.brand', 'items.product.category', 'items.productVariant', 'items.productSerial'])
                ->withCount('bids')
                ->orderBy('sequence'),
        ]);

        return Inertia::render('commercial/auction-events/show', [
            'event' => AuctionEventResource::make($auctionEvent),
        ]);
    }

    public function edit(AuctionEvent $auctionEvent): Response|RedirectResponse
    {
        $auctionEvent->load(['auctions.items.productVariant.product.brand', 'auctions.items.productSerial']);

        if ($auctionEvent->auctions->contains(fn (Auction $auction) => $auction->status !== AuctionStatus::Draft)) {
            return redirect()
                ->route('admin.auction-events.show', $auctionEvent)
                ->with('error', 'Only draft auction events can be edited.');
        }

        return $this->renderEventForm($auctionEvent, $auctionEvent->auctions->first());
    }

    public function update(
        AuctionEvent $auctionEvent,
        StoreAuctionEventRequest $request,
        UpdateAuctionEvent $updateAuctionEvent,
    ): RedirectResponse {
        if ($auctionEvent->auctions()->where('status', '!=', AuctionStatus::Draft->value)->exists()) {
            return redirect()
                ->route('admin.auction-events.show', $auctionEvent)
                ->with('error', 'Only draft auction events can be edited.');
        }

        $updateAuctionEvent->handle($auctionEvent, $request->validated());

        return redirect()
            ->route('admin.auction-events.show', $auctionEvent)
            ->with('success', 'Auction event updated successfully.');
    }

    private function renderEventForm(
        ?AuctionEvent $auctionEvent = null,
        ?Auction $auction = null,
    ): Response {
        $variantUnits = ProductVariant::query()
            ->with(['product.brand'])
            ->where('is_active', true)
            ->whereHas('product', fn ($query) => $query
                ->where('status', ProductStatus::Active)
                ->where('has_serial_numbers', false))
            ->orderBy('sku')
            ->get()
            ->map(fn (ProductVariant $variant) => [
                'id' => $variant->id,
                'label' => trim(($variant->product?->brand?->name ? $variant->product->brand->name.' ' : '').($variant->product?->name ?? '').' / '.$variant->sku),
                'price' => $variant->price,
                'product_name' => $variant->product?->name,
                'brand_name' => $variant->product?->brand?->name,
                'attribute_summary' => $variant->attribute_summary,
                'image_url' => $variant->product?->getFirstMediaUrl('product'),
            ])
            ->values();

        $serialUnits = ProductSerial::query()
            ->with(['productVariant.product.brand'])
            ->where('status', ProductSerialStatus::Available)
            ->whereHas('productVariant', fn ($query) => $query
                ->where('is_active', true)
                ->whereHas('product', fn ($productQuery) => $productQuery
                    ->where('status', ProductStatus::Active)
                    ->where('has_serial_numbers', true)))
            ->orderBy('serial_number')
            ->get()
            ->map(fn (ProductSerial $serial) => [
                'id' => $serial->id,
                'product_variant_id' => $serial->product_variant_id,
                'label' => trim(($serial->productVariant?->product?->brand?->name ? $serial->productVariant->product->brand->name.' ' : '').($serial->productVariant?->product?->name ?? '').' / '.$serial->serial_number),
                'price' => $serial->productVariant?->price,
                'product_name' => $serial->productVariant?->product?->name,
                'brand_name' => $serial->productVariant?->product?->brand?->name,
                'attribute_summary' => $serial->productVariant?->attribute_summary,
                'image_url' => $serial->productVariant?->product?->getFirstMediaUrl('product'),
            ])
            ->values();

        return Inertia::render(
            $auctionEvent && $auction
                ? 'commercial/auction-events/edit'
                : 'commercial/auction-events/create',
            [
                'variant_units' => $variantUnits,
                'serial_units' => $serialUnits,
                'event' => $auctionEvent ? AuctionEventResource::make($auctionEvent->loadMissing('auctions.items')) : null,
                'auction' => $auction ? AuctionResource::make($auction) : null,
            ],
        );
    }
}
