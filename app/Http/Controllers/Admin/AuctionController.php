<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Auctions\CloseAuction;
use App\Actions\Auctions\CreateAuction;
use App\Enums\AuctionClosureResult;
use App\Enums\AuctionStatus;
use App\Enums\ProductSerialStatus;
use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAuctionRequest;
use App\Http\Resources\AuctionResource;
use App\Models\Auction;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuctionController extends Controller
{
    public function index(Request $request): Response
    {
        $auctions = Auction::query()
            ->with(['creator', 'winner'])
            ->withCount('bids')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('closure_result'), fn ($query) => $query->where('closure_result', $request->string('closure_result')))
            ->when($request->filled('inventory_source_type'), fn ($query) => $query->where('inventory_source_type', $request->string('inventory_source_type')))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($innerQuery) use ($search): void {
                    $innerQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('lot_number', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('commercial/auctions/index', [
            'auctions' => AuctionResource::collection($auctions),
            'filters' => $request->only(['status', 'closure_result', 'inventory_source_type', 'search']),
            'statuses' => collect(AuctionStatus::cases())->map(fn (AuctionStatus $status) => [
                'value' => $status->value,
                'label' => ucfirst($status->value),
            ])->values(),
            'closure_results' => collect(AuctionClosureResult::cases())->map(fn (AuctionClosureResult $result) => [
                'value' => $result->value,
                'label' => str($result->value)->replace('_', ' ')->title()->toString(),
            ])->values(),
            'inventory_source_types' => collect([
                ['value' => 'variant', 'label' => 'Variant / simple'],
                ['value' => 'serial', 'label' => 'Serial unit'],
            ])->values(),
        ]);
    }

    public function create(): Response
    {
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

        return Inertia::render('commercial/auctions/create', [
            'variant_units' => $variantUnits,
            'serial_units' => $serialUnits,
        ]);
    }

    public function store(StoreAuctionRequest $request, CreateAuction $createAuction): RedirectResponse
    {
        $createAuction->handle($request->validated(), $request->user());

        return redirect()
            ->route('admin.auctions.index')
            ->with('success', 'Auction created successfully.');
    }

    public function show(Auction $auction): Response
    {
        $auction->load([
            'creator',
            'closer',
            'winner',
            'currentBidUser',
            'bids' => fn ($query) => $query->with('user')->latest('placed_at'),
        ]);

        return Inertia::render('commercial/auctions/show', [
            'auction' => AuctionResource::make($auction),
        ]);
    }

    public function publish(Auction $auction): RedirectResponse
    {
        if ($auction->status !== AuctionStatus::Draft) {
            return back()->with('error', 'Only draft auctions can be published.');
        }

        if ($auction->ends_at->isPast()) {
            return back()->with('error', 'Expired auctions can not be published.');
        }

        $auction->update([
            'status' => now()->greaterThanOrEqualTo($auction->starts_at)
                ? AuctionStatus::Live
                : AuctionStatus::Scheduled,
        ]);

        return back()->with('success', 'Auction published successfully.');
    }

    public function close(Auction $auction, Request $request, CloseAuction $closeAuction): RedirectResponse
    {
        if (! in_array($auction->status, [AuctionStatus::Scheduled, AuctionStatus::Live], true)) {
            return back()->with('error', 'Only scheduled or live auctions can be closed.');
        }

        $closeAuction->handle($auction, $request->user());

        return back()->with('success', 'Auction closed successfully.');
    }

    public function cancel(Auction $auction): RedirectResponse
    {
        if (in_array($auction->status, [AuctionStatus::Closed, AuctionStatus::Cancelled], true)) {
            return back()->with('error', 'This auction can not be cancelled anymore.');
        }

        $auction->update([
            'status' => AuctionStatus::Cancelled,
            'closed_at' => now(),
        ]);

        return back()->with('success', 'Auction cancelled successfully.');
    }
}
