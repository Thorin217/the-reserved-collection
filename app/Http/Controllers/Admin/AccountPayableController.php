<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Finance\RecordPayablePayment;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAccountPayableRequest;
use App\Http\Requests\Admin\StorePayablePaymentRequest;
use App\Http\Resources\AccountPayableResource;
use App\Http\Resources\VendorResource;
use App\Models\AccountPayable;
use App\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AccountPayableController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('finance/payables/create', [
            'vendors' => VendorResource::collection(
                Vendor::query()->where('is_active', true)->orderBy('name')->get()
            ),
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

    public function store(StoreAccountPayableRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $vendorName = null;
        if (isset($data['vendor_id'])) {
            $vendor = Vendor::findOrFail($data['vendor_id']);
            $vendorName = $vendor->name;
        } else {
            $vendorName = $data['vendor_name'];
        }

        $amount = (float) $data['amount'];
        $paidAmount = (float) ($data['paid_amount'] ?? 0);
        $balanceDue = $amount - $paidAmount;

        $status = match (true) {
            $balanceDue <= 0 => PaymentStatus::Paid,
            $paidAmount > 0 => PaymentStatus::Partial,
            default => PaymentStatus::Pending,
        };

        AccountPayable::create([
            'vendor_id' => $data['vendor_id'] ?? null,
            'vendor_name' => $vendorName,
            'user_id' => $request->user()?->id,
            'reference' => $data['reference'] ?? null,
            'amount' => $amount,
            'paid_amount' => $paidAmount,
            'balance_due' => $balanceDue,
            'status' => $status,
            'paid_at' => $balanceDue <= 0 ? now() : null,
            'due_date' => $data['due_date'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return redirect()
            ->route('admin.finance.payables.index')
            ->with('success', 'Payable registered successfully.');
    }

    public function show(AccountPayable $payable): Response
    {
        $payable->load(['vendor', 'sale', 'payments']);

        return Inertia::render('finance/payables/show', [
            'payable' => AccountPayableResource::make($payable),
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
        StorePayablePaymentRequest $request,
        AccountPayable $payable,
        RecordPayablePayment $recordPayment,
    ): RedirectResponse {
        $recordPayment->handle($payable, $request->validated());

        return redirect()
            ->route('admin.finance.payables.show', $payable)
            ->with('success', 'Payment recorded successfully.');
    }

    public function index(Request $request): Response
    {
        $payables = QueryBuilder::for(AccountPayable::class)
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value): void {
                    $query->where(function ($innerQuery) use ($value): void {
                        $innerQuery
                            ->where('reference', 'like', "%{$value}%")
                            ->orWhere('vendor_name', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('status'),
            )
            ->with(['sale', 'user', 'vendor'])
            ->orderByRaw('due_date is null, due_date asc')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        Inertia::encryptHistory();

        return Inertia::render('finance/payables/index', [
            'payables' => AccountPayableResource::collection($payables),
            'metrics' => [
                'pending_count' => AccountPayable::query()->where('status', PaymentStatus::Pending)->count(),
                'partial_count' => AccountPayable::query()->where('status', PaymentStatus::Partial)->count(),
                'overdue_count' => AccountPayable::query()
                    ->whereDate('due_date', '<', now()->toDateString())
                    ->where('balance_due', '>', 0)
                    ->count(),
                'balance_total' => (float) AccountPayable::query()->sum('balance_due'),
            ],
            'filters' => $request->only(['filter']),
        ]);
    }
}
