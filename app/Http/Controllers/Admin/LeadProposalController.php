<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeadProposalRequest;
use App\Http\Resources\LeadProposalResource;
use App\Http\Resources\LeadResource;
use App\Http\Resources\ProductResource;
use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadProposalController extends Controller
{
    public function show(Lead $lead, LeadProposal $proposal): Response
    {
        $proposal->load([
            'user',
            'items.product.brand',
            'items.variant',
            'items.serial',
        ]);

        return Inertia::render('crm/leads/proposals/show', [
            'lead' => LeadResource::make($lead->load('client')),
            'proposal' => LeadProposalResource::make($proposal),
        ]);
    }

    public function create(Request $request, Lead $lead): Response
    {
        $lead->load('client');

        $products = Product::with(['brand', 'category', 'variants'])
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
        $request->validate([
            'sent_via' => ['required', 'in:whatsapp,email'],
        ]);

        $proposal->update([
            'status' => 'sent',
            'sent_via' => $request->sent_via,
            'sent_at' => now(),
        ]);

        return redirect()->route('admin.leads.show', $lead)
            ->with('success', 'Proposal marked as sent.');
    }

    public function destroy(Lead $lead, LeadProposal $proposal): RedirectResponse
    {
        $proposal->delete();

        return redirect()->route('admin.leads.show', $lead)
            ->with('success', 'Proposal deleted.');
    }
}
