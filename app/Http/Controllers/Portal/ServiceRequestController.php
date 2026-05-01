<?php

namespace App\Http\Controllers\Portal;

use App\Enums\PaymentStatus;
use App\Enums\SalePaymentType;
use App\Enums\SaleStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\ServiceType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\StoreServiceRequestRequest;
use App\Http\Resources\ServiceRequestResource;
use App\Models\AccountReceivable;
use App\Models\Client;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ServiceRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $client = $user->client;

        $requests = ServiceRequest::query()
            ->where('user_id', $user->id)
            ->with(['saleItem.productVariant.product.brand', 'sale', 'messages.user'])
            ->latest()
            ->get();

        $collectionItems = [];

        if ($client !== null) {
            $sales = Sale::query()
                ->where('client_id', $client->id)
                ->where('status', SaleStatus::Confirmed)
                ->with(['items.productVariant.product.brand'])
                ->latest('sold_at')
                ->get();

            foreach ($sales as $sale) {
                foreach ($sale->items as $item) {
                    $collectionItems[] = [
                        'sale_item_id' => $item->id,
                        'name' => $item->productVariant?->product?->name ?? $item->description,
                        'brand' => $item->productVariant?->product?->brand?->name,
                    ];
                }
            }
        }

        $serviceTypes = collect(ServiceType::cases())->map(fn (ServiceType $type) => [
            'value' => $type->value,
            'label' => $type->label(),
        ])->values()->all();

        return Inertia::render('portal/service-requests/index', [
            'service_requests' => ServiceRequestResource::collection($requests),
            'collection_items' => $collectionItems,
            'has_collection' => count($collectionItems) > 0,
            'service_types' => $serviceTypes,
        ]);
    }

    public function store(StoreServiceRequestRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        if (isset($validated['sale_item_id'])) {
            $saleItem = SaleItem::findOrFail($validated['sale_item_id']);
            $clientId = $user->client?->id;

            abort_unless(
                Sale::query()
                    ->where('id', $saleItem->sale_id)
                    ->where('client_id', $clientId)
                    ->where('status', SaleStatus::Confirmed)
                    ->exists(),
                403,
            );
        }

        $serviceRequest = ServiceRequest::create([
            'user_id' => $user->id,
            'client_id' => $user->client?->id,
            'sale_item_id' => $validated['sale_item_id'] ?? null,
            'service_type' => $validated['service_type'],
            'status' => 'scheduled',
            'scheduled_at' => $validated['scheduled_at'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->createServiceSale($user, $serviceRequest);

        return back()->with('success', 'Service request submitted successfully.');
    }

    public function storeMessage(Request $request, ServiceRequest $serviceRequest): RedirectResponse
    {
        abort_unless($serviceRequest->user_id === $request->user()->id, 403);

        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $serviceRequest->messages()->create([
            'user_id' => $request->user()->id,
            'is_admin' => false,
            'message' => $request->string('message'),
        ]);

        return back()->with('success', 'Message sent.');
    }

    public function pay(Request $request, ServiceRequest $serviceRequest): RedirectResponse
    {
        abort_unless($serviceRequest->user_id === $request->user()->id, 403);
        abort_unless($serviceRequest->sale_id !== null, 422);

        $sale = Sale::findOrFail($serviceRequest->sale_id);
        abort_unless($sale->status === SaleStatus::Confirmed, 422);
        abort_unless((float) $sale->balance_due > 0, 422);

        $request->validate([
            'card_name' => ['required', 'string', 'max:100'],
            'card_number' => ['required', 'string'],
            'card_expiry' => ['required', 'string'],
            'card_cvv' => ['required', 'string'],
        ]);

        $sale->update(['balance_due' => 0]);

        AccountReceivable::query()
            ->where('sale_id', $sale->id)
            ->update([
                'status' => PaymentStatus::Paid,
                'paid_amount' => $sale->total,
                'balance_due' => 0,
                'paid_at' => now(),
            ]);

        return back()->with('success', 'Payment received. Thank you!');
    }

    public function cancel(Request $request, ServiceRequest $serviceRequest): RedirectResponse
    {
        abort_unless($serviceRequest->user_id === $request->user()->id, 403);
        abort_unless(
            ! in_array($serviceRequest->status, [ServiceRequestStatus::Completed, ServiceRequestStatus::Cancelled]),
            422,
        );

        $serviceRequest->update(['status' => ServiceRequestStatus::Cancelled]);

        if ($serviceRequest->sale_id !== null) {
            $sale = Sale::findOrFail($serviceRequest->sale_id);

            if ($sale->status !== SaleStatus::Confirmed) {
                $sale->update(['status' => SaleStatus::Cancelled]);
            }

            AccountReceivable::query()
                ->where('sale_id', $sale->id)
                ->update(['status' => PaymentStatus::Cancelled]);
        }

        return back()->with('success', 'Service request cancelled.');
    }

    private function createServiceSale(User $user, ServiceRequest $serviceRequest): void
    {
        DB::transaction(function () use ($user, $serviceRequest): void {
            $client = $user->client ?? Client::query()->create([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => true,
            ]);

            $defaultWarehouse = Warehouse::query()
                ->orderByDesc('is_default')
                ->where('allows_sales', true)
                ->first();

            $serviceType = $serviceRequest->service_type;
            $itemName = $serviceRequest->saleItem?->productVariant?->product?->name;
            $description = $serviceType->label().($itemName ? ' — '.$itemName : '');

            $sale = Sale::query()->create([
                'client_id' => $client->id,
                'warehouse_id' => $defaultWarehouse?->id,
                'user_id' => $user->id,
                'sale_number' => 'SALE-TMP-'.Str::upper(Str::random(12)),
                'status' => SaleStatus::Draft,
                'currency' => 'USD',
                'payment_type' => SalePaymentType::Credit,
                'sold_at' => null,
                'subtotal' => 0,
                'tax_total' => 0,
                'discount_total' => 0,
                'total' => 0,
                'balance_due' => 0,
                'notes' => 'Service request #'.$serviceRequest->id.' — '.$description,
            ]);

            $sale->forceFill([
                'sale_number' => 'SALE-'.str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT),
            ])->save();

            $sale->items()->create([
                'product_variant_id' => null,
                'product_serial_id' => null,
                'description' => $description,
                'quantity' => 1,
                'unit_price' => 0,
                'line_total' => 0,
            ]);

            $serviceRequest->update(['sale_id' => $sale->id]);
        });
    }
}
