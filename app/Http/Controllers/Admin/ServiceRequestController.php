<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Finance\ConfirmSale;
use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use App\Enums\ServiceRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateServiceRequestRequest;
use App\Http\Resources\ServiceRequestResource;
use App\Models\AccountReceivable;
use App\Models\Sale;
use App\Models\ServiceRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ServiceRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $requests = QueryBuilder::for(ServiceRequest::class)
            ->allowedFilters(
                AllowedFilter::exact('status'),
                AllowedFilter::exact('service_type'),
            )
            ->with(['user', 'client', 'saleItem.productVariant.product.brand'])
            ->orderByRaw('scheduled_at asc')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/service-requests/index', [
            'requests' => ServiceRequestResource::collection($requests),
            'metrics' => [
                'scheduled_count' => ServiceRequest::query()->where('status', ServiceRequestStatus::Scheduled)->count(),
                'in_progress_count' => ServiceRequest::query()->where('status', ServiceRequestStatus::InProgress)->count(),
                'completed_count' => ServiceRequest::query()->where('status', ServiceRequestStatus::Completed)->count(),
            ],
            'filters' => $request->only(['filter']),
        ]);
    }

    public function show(ServiceRequest $serviceRequest): Response
    {
        $serviceRequest->load(['user', 'client', 'saleItem.productVariant.product.brand', 'saleItem.sale', 'sale', 'messages.user']);

        return Inertia::render('admin/service-requests/show', [
            'service_request' => ServiceRequestResource::make($serviceRequest),
            'statuses' => collect(ServiceRequestStatus::cases())->map(fn (ServiceRequestStatus $s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ])->values()->all(),
        ]);
    }

    public function update(UpdateServiceRequestRequest $request, ServiceRequest $serviceRequest): RedirectResponse
    {
        $validated = $request->validated();

        $completedAt = $serviceRequest->completed_at;
        if ($validated['status'] === ServiceRequestStatus::Completed->value && $completedAt === null) {
            $completedAt = now();
        } elseif ($validated['status'] !== ServiceRequestStatus::Completed->value) {
            $completedAt = null;
        }

        $serviceRequest->update([
            'status' => $validated['status'],
            'internal_notes' => $validated['internal_notes'] ?? $serviceRequest->internal_notes,
            'completed_at' => $completedAt,
        ]);

        return back()->with('success', 'Service request updated.');
    }

    public function storeMessage(Request $request, ServiceRequest $serviceRequest): RedirectResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $serviceRequest->messages()->create([
            'user_id' => $request->user()->id,
            'is_admin' => true,
            'message' => $request->string('message'),
        ]);

        return back()->with('success', 'Message sent.');
    }

    public function sendInvoice(ServiceRequest $serviceRequest): RedirectResponse
    {
        abort_unless($serviceRequest->sale_id !== null, 422);

        $sale = Sale::findOrFail($serviceRequest->sale_id);
        abort_if($sale->status === SaleStatus::Confirmed, 422);
        abort_unless((float) $sale->total > 0, 422);

        app(ConfirmSale::class)->handle($sale);

        return back()->with('success', 'Invoice sent to the client.');
    }

    public function markPaid(ServiceRequest $serviceRequest): RedirectResponse
    {
        abort_unless($serviceRequest->sale_id !== null, 422);

        $sale = Sale::findOrFail($serviceRequest->sale_id);
        abort_unless((float) $sale->balance_due > 0, 422);

        $sale->update(['balance_due' => 0]);

        AccountReceivable::query()
            ->where('sale_id', $sale->id)
            ->update([
                'status' => PaymentStatus::Paid,
                'paid_amount' => $sale->total,
                'balance_due' => 0,
                'paid_at' => now(),
            ]);

        return back()->with('success', 'Service invoice marked as paid.');
    }
}
