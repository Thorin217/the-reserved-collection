<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeadProposalRequest;
use App\Http\Resources\LeadProposalResource;
use App\Http\Resources\LeadResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\UserResource;
use App\Mail\ProposalMailable;
use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class LeadProposalController extends Controller
{
    public function index(Request $request): Response
    {
        $proposals = QueryBuilder::for(LeadProposal::class)
            ->allowedFilters(
                AllowedFilter::partial('search', 'title'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('sent_via'),
                AllowedFilter::exact('user_id'),
            )
            ->with(['lead.client', 'user'])
            ->withCount('items')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('crm/proposals/index', [
            'proposals' => LeadProposalResource::collection($proposals),
            'users' => UserResource::collection(User::orderBy('name')->get()),
            'filters' => $request->only(['filter']),
        ]);
    }

    public function show(Lead $lead, LeadProposal $proposal): Response
    {
        $proposal->load([
            'user',
            'items.product.brand',
            'items.product.media',
            'items.variant',
            'items.serial',
        ]);

        $previewUrl = URL::temporarySignedRoute(
            'portal.proposals.preview',
            now()->addDays(7),
            ['proposal' => $proposal->id],
        );

        return Inertia::render('crm/leads/proposals/show', [
            'lead' => LeadResource::make($lead->load('client')),
            'proposal' => LeadProposalResource::make($proposal),
            'preview_url' => $previewUrl,
        ]);
    }

    public function create(Request $request, Lead $lead): Response
    {
        $lead->load('client');

        $products = Product::with(['brand', 'category', 'variants', 'media'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('crm/leads/proposals/create', [
            'lead' => LeadResource::make($lead),
            'products' => ProductResource::collection($products),
        ]);
    }

    public function store(StoreLeadProposalRequest $request, Lead $lead): RedirectResponse
    {
        $validated = $request->validated();

        $proposal = $lead->proposals()->create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $proposal->items()->create($item);
        }

        return redirect()->route('admin.leads.show', $lead)
            ->with('success', 'Proposal created.');
    }

    public function send(Request $request, Lead $lead, LeadProposal $proposal): RedirectResponse
    {
        $validated = $request->validate([
            'sent_via' => ['required', 'in:whatsapp,email'],
        ]);

        $previewUrl = URL::temporarySignedRoute(
            'portal.proposals.preview',
            now()->addDays(7),
            ['proposal' => $proposal->id],
        );

        if ($validated['sent_via'] === 'email') {
            $lead->loadMissing('client');

            if (! $lead->client?->email) {
                return redirect()->back()->with('error', 'Client has no email address.');
            }

            $proposal->loadMissing('items.product');

            Mail::to($lead->client->email)
                ->send(new ProposalMailable($proposal, $lead, $previewUrl));
        }

        $proposal->update([
            'status' => 'sent',
            'sent_via' => $validated['sent_via'],
            'sent_at' => now(),
        ]);

        $message = $validated['sent_via'] === 'email'
            ? 'Proposal sent by email.'
            : 'Proposal marked as sent via WhatsApp.';

        return redirect()->route('admin.leads.proposals.show', [$lead, $proposal])
            ->with('success', $message);
    }

    public function destroy(Lead $lead, LeadProposal $proposal): RedirectResponse
    {
        $proposal->delete();

        return redirect()->route('admin.leads.show', $lead)
            ->with('success', 'Proposal deleted.');
    }
}
