<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AccountReceivableResource;
use App\Models\AccountReceivable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AccountReceivableController extends Controller
{
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
