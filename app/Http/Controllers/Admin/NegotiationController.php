<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreNegotiationOfferRequest;
use App\Http\Requests\Admin\StoreNegotiationRequest;
use App\Http\Resources\LeadResource;
use App\Http\Resources\NegotiationResource;
use App\Http\Resources\UserResource;
use App\Models\Lead;
use App\Models\Negotiation;
use App\Models\NegotiationOffer;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class NegotiationController extends Controller
{
    public function index(Request $request): Response
    {
        $negotiations = QueryBuilder::for(Negotiation::class)
            ->allowedFilters(
                AllowedFilter::exact('status'),
                AllowedFilter::exact('user_id'),
            )
            ->with(['lead.client', 'user', 'proposal'])
            ->withCount('offers')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('crm/negotiations/index', [
            'negotiations' => NegotiationResource::collection($negotiations),
            'users' => UserResource::collection(User::orderBy('name')->get()),
            'filters' => $request->only(['filter']),
        ]);
    }

    public function show(Lead $lead, Negotiation $negotiation): Response
    {
        $negotiation->load(['user', 'proposal.items.product', 'offers' => fn ($q) => $q->with('user')->oldest()]);
        $lead->load('client');

        return Inertia::render('crm/leads/negotiations/show', [
            'lead' => LeadResource::make($lead),
            'negotiation' => NegotiationResource::make($negotiation),
        ]);
    }

    public function store(StoreNegotiationRequest $request, Lead $lead): RedirectResponse
    {
        $lead->negotiations()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'status' => 'negotiating',
        ]);

        return redirect()->route('admin.leads.show', $lead)
            ->with('success', 'Negotiation started.');
    }

    public function update(Request $request, Lead $lead, Negotiation $negotiation): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:negotiating,agreed,rejected'],
            'final_price' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $data = $request->only(['status', 'notes', 'final_price']);

        if ($request->status === 'agreed' && $negotiation->agreed_at === null) {
            $data['agreed_at'] = now();

            // marcar el lead como ganado automáticamente
            $lead->update(['status' => 'won', 'closed_at' => now()]);
        }

        $negotiation->update($data);

        return redirect()->route('admin.leads.negotiations.show', [$lead, $negotiation])
            ->with('success', 'Negotiation updated.');
    }

    public function destroy(Lead $lead, Negotiation $negotiation): RedirectResponse
    {
        $negotiation->delete();

        return redirect()->route('admin.leads.show', $lead)
            ->with('success', 'Negotiation deleted.');
    }

    public function storeOffer(StoreNegotiationOfferRequest $request, Lead $lead, Negotiation $negotiation): RedirectResponse
    {
        $negotiation->offers()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('admin.leads.negotiations.show', [$lead, $negotiation])
            ->with('success', 'Offer added.');
    }

    public function destroyOffer(Lead $lead, Negotiation $negotiation, NegotiationOffer $offer): RedirectResponse
    {
        $offer->delete();

        return redirect()->route('admin.leads.negotiations.show', [$lead, $negotiation])
            ->with('success', 'Offer removed.');
    }
}
