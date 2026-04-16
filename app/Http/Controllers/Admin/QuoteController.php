<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Finance\CreateSaleFromQuote;
use App\Actions\Finance\SaveQuote;
use App\Enums\QuoteStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuoteRequest;
use App\Http\Requests\Admin\UpdateQuoteRequest;
use App\Http\Resources\ClientResource;
use App\Http\Resources\LeadResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\QuoteResource;
use App\Http\Resources\UserResource;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Product;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class QuoteController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Quote::class);

        $quotes = QueryBuilder::for(Quote::class)
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value): void {
                    $query->where(function ($innerQuery) use ($value): void {
                        $innerQuery
                            ->where('quote_number', 'like', "%{$value}%")
                            ->orWhereHas('client', fn ($clientQuery) => $clientQuery->where('name', 'like', "%{$value}%"));
                    });
                }),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('user_id'),
            )
            ->withCount('items')
            ->with(['client', 'lead.client', 'user', 'negotiation', 'sales:id,quote_id'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('finance/quotes/index', [
            'quotes' => QuoteResource::collection($quotes),
            'users' => UserResource::collection(User::query()->orderBy('name')->get()),
            'metrics' => [
                'draft_count' => Quote::query()->where('status', QuoteStatus::Draft)->count(),
                'sent_count' => Quote::query()->where('status', QuoteStatus::Sent)->count(),
                'approved_count' => Quote::query()->where('status', QuoteStatus::Approved)->count(),
                'total_value' => (float) Quote::query()->sum('total'),
            ],
            'can' => [
                'create' => $request->user()?->can('create', Quote::class) ?? false,
            ],
            'filters' => $request->only(['filter']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Quote::class);

        return Inertia::render('finance/quotes/create', [
            ...$this->formOptions(),
            'can' => [
                'create' => $request->user()?->can('create', Quote::class) ?? false,
            ],
        ]);
    }

    public function store(StoreQuoteRequest $request, SaveQuote $saveQuote): RedirectResponse
    {
        $quote = $saveQuote->handle($request->validated(), $request->user());

        return redirect()
            ->route('admin.finance.quotes.edit', $quote)
            ->with('success', 'Quote created successfully.');
    }

    public function edit(Request $request, Quote $quote): Response
    {
        $this->authorize('update', $quote);

        $quote->load([
            'client',
            'lead.client',
            'user',
            'items.productVariant.product.brand',
            'items.productSerial',
            'sales:id,quote_id',
        ]);

        return Inertia::render('finance/quotes/edit', [
            'quote' => QuoteResource::make($quote),
            ...$this->formOptions(),
            'can' => [
                'delete' => $request->user()?->can('delete', $quote) ?? false,
            ],
        ]);
    }

    public function update(UpdateQuoteRequest $request, Quote $quote, SaveQuote $saveQuote): RedirectResponse
    {
        $this->authorize('update', $quote);

        $quote = $saveQuote->handle($request->validated(), $request->user(), $quote);

        return redirect()
            ->route('admin.finance.quotes.edit', $quote)
            ->with('success', 'Quote updated successfully.');
    }

    public function destroy(Quote $quote): RedirectResponse
    {
        $this->authorize('delete', $quote);

        $quote->delete();

        return redirect()
            ->route('admin.finance.quotes.index')
            ->with('success', 'Quote deleted successfully.');
    }

    public function convertToSale(Request $request, Quote $quote, CreateSaleFromQuote $createSaleFromQuote): RedirectResponse
    {
        $this->authorize('convertToSale', $quote);

        if ($quote->sales()->exists()) {
            $sale = $quote->sales()->latest('id')->first();

            if ($sale === null) {
                throw ValidationException::withMessages([
                    'quote' => 'The quote has already been converted.',
                ]);
            }

            return redirect()
                ->route('admin.finance.sales.edit', $sale)
                ->with('success', 'Quote already has a related sale.');
        }

        $sale = $createSaleFromQuote->handle($quote, $request->user());

        return redirect()
            ->route('admin.finance.sales.edit', $sale)
            ->with('success', 'Quote converted to sale successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'clients' => ClientResource::collection(
                Client::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get()
            ),
            'leads' => LeadResource::collection(
                Lead::query()
                    ->with('client')
                    ->latest()
                    ->get()
            ),
            'products' => ProductResource::collection(
                Product::query()
                    ->with(['brand', 'variants'])
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get()
            ),
            'statuses' => collect(QuoteStatus::cases())
                ->map(fn (QuoteStatus $status): array => [
                    'value' => $status->value,
                    'label' => Str::headline($status->value),
                ])
                ->values(),
            'currencies' => [
                ['value' => 'USD', 'label' => 'USD'],
            ],
        ];
    }
}
