<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Finance\RecordReceivablePayment;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAccountReceivableRequest;
use App\Http\Requests\Admin\StoreReceivablePaymentRequest;
use App\Http\Resources\AccountReceivableResource;
use App\Http\Resources\ClientResource;
use App\Models\AccountReceivable;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AccountReceivableController extends Controller
{
    public function create(Request $request): Response
    {
        $clients = Client::query()->where('is_active', true)->orderBy('name')->get();

        return Inertia::render('finance/receivables/create', [
            'clients' => ClientResource::collection($clients),
            'default_client_id' => $request->query('client_id'),
        ]);
    }

    public function store(StoreAccountReceivableRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        AccountReceivable::create([
            'client_id' => $validated['client_id'],
            'reference' => $validated['reference'] ?? null,
            'amount' => $validated['amount'],
            'paid_amount' => 0,
            'balance_due' => $validated['amount'],
            'due_date' => $validated['due_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => PaymentStatus::Pending,
        ]);

        return redirect()
            ->route('admin.finance.receivables.index')
            ->with('success', 'Receivable registered successfully.');
    }

    public function show(AccountReceivable $receivable): Response
    {
        $receivable->load(['client', 'sale', 'payments']);

        return Inertia::render('finance/receivables/show', [
            'receivable' => AccountReceivableResource::make($receivable),
            'payment_methods' => collect(PaymentMethod::cases())->map(fn (PaymentMethod $method) => [
                'value' => $method->value,
                'label' => match ($method) {
                    PaymentMethod::Cash => 'Cash',
                    PaymentMethod::BankTransfer => 'Bank Transfer',
                    PaymentMethod::Card => 'Card',
                    PaymentMethod::Check => 'Check',
                    PaymentMethod::Other => 'Other',
                },
            ])->values()->all(),
        ]);
    }

    public function storePayment(
        StoreReceivablePaymentRequest $request,
        AccountReceivable $receivable,
        RecordReceivablePayment $recordPayment,
    ): RedirectResponse {
        $recordPayment->handle($receivable, $request->validated());

        return redirect()
            ->route('admin.finance.receivables.show', $receivable)
            ->with('success', 'Payment recorded successfully.');
    }

    public function index(Request $request): Response
    {
        $receivables = QueryBuilder::for(AccountReceivable::class)
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value): void {
                    $query->where(function ($innerQuery) use ($value): void {
                        $innerQuery
                            ->where('reference', 'like', "%{$value}%")
                            ->orWhereHas('client', fn ($clientQuery) => $clientQuery->where('name', 'like', "%{$value}%"));
                    });
                }),
                AllowedFilter::exact('status'),
            )
            ->with(['client', 'sale'])
            ->orderByRaw('due_date is null, due_date asc')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        Inertia::encryptHistory();

        return Inertia::render('finance/receivables/index', [
            'receivables' => AccountReceivableResource::collection($receivables),
            'metrics' => [
                'pending_count' => AccountReceivable::query()->where('status', PaymentStatus::Pending)->count(),
                'partial_count' => AccountReceivable::query()->where('status', PaymentStatus::Partial)->count(),
                'overdue_count' => AccountReceivable::query()
                    ->whereDate('due_date', '<', now()->toDateString())
                    ->where('balance_due', '>', 0)
                    ->count(),
                'balance_total' => (float) AccountReceivable::query()->sum('balance_due'),
            ],
            'filters' => $request->only(['filter']),
        ]);
    }
}
