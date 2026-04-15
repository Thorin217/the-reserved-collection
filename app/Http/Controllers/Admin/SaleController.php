<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SaleStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\SaleResource;
use App\Http\Resources\UserResource;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $sales = QueryBuilder::for(Sale::class)
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value): void {
                    $query->where(function ($innerQuery) use ($value): void {
                        $innerQuery
                            ->where('sale_number', 'like', "%{$value}%")
                            ->orWhereHas('client', fn ($clientQuery) => $clientQuery->where('name', 'like', "%{$value}%"));
                    });
                }),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('user_id'),
            )
            ->with(['client', 'warehouse', 'user', 'quote', 'negotiation'])
            ->latest('sold_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('finance/sales/index', [
            'sales' => SaleResource::collection($sales),
            'users' => UserResource::collection(User::query()->orderBy('name')->get()),
            'metrics' => [
                'draft_count' => Sale::query()->where('status', SaleStatus::Draft)->count(),
                'confirmed_count' => Sale::query()->where('status', SaleStatus::Confirmed)->count(),
                'total_value' => (float) Sale::query()->sum('total'),
                'pending_balance' => (float) Sale::query()->sum('balance_due'),
            ],
            'filters' => $request->only(['filter']),
        ]);
    }
}
