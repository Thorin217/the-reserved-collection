<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AccountPayableResource;
use App\Models\AccountPayable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AccountPayableController extends Controller
{
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
            ->with(['sale', 'user'])
            ->orderByRaw('due_date is null, due_date asc')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

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
