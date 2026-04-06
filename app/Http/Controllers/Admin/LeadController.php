<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeadRequest;
use App\Http\Requests\Admin\UpdateLeadRequest;
use App\Http\Resources\ClientResource;
use App\Http\Resources\LeadResource;
use App\Http\Resources\UserResource;
use App\Models\Client;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $leads = Lead::with(['client', 'assignedUser'])
            ->withCount('interactions')
            ->when($request->search, fn ($q, $search) => $q->where('title', 'like', "%{$search}%")->orWhereHas('client', fn ($q) => $q->where('name', 'like', "%{$search}%")))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->source, fn ($q, $source) => $q->where('source', $source))
            ->when($request->assigned_to, fn ($q, $userId) => $q->where('assigned_to', $userId))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('crm/leads/index', [
            'leads' => LeadResource::collection($leads),
            'clients' => ClientResource::collection(Client::where('is_active', true)->orderBy('name')->get()),
            'users' => UserResource::collection(User::orderBy('name')->get()),
            'filters' => $request->only(['search', 'status', 'source', 'assigned_to']),
        ]);
    }

    public function show(Lead $lead): Response
    {
        $lead->load(['client', 'assignedUser', 'interactions' => fn ($q) => $q->with('user')->latest('interacted_at')]);

        return Inertia::render('crm/leads/show', [
            'lead' => LeadResource::make($lead),
            'clients' => ClientResource::collection(Client::where('is_active', true)->orderBy('name')->get()),
            'users' => UserResource::collection(User::orderBy('name')->get()),
        ]);
    }

    public function store(StoreLeadRequest $request): RedirectResponse
    {
        Lead::create($request->validated());

        return redirect()->route('admin.leads.index')->with('success', 'Lead created successfully.');
    }

    public function edit(Lead $lead): Response
    {
        $lead->load(['client', 'assignedUser', 'interactions.user']);

        return Inertia::render('crm/leads/edit', [
            'lead' => LeadResource::make($lead),
            'clients' => ClientResource::collection(Client::where('is_active', true)->orderBy('name')->get()),
            'users' => UserResource::collection(User::orderBy('name')->get()),
        ]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): RedirectResponse
    {
        $data = $request->validated();

        // Marcar fecha de cierre automáticamente al ganar/perder
        if (in_array($data['status'], ['won', 'lost']) && $lead->closed_at === null) {
            $data['closed_at'] = now();
        } elseif (! in_array($data['status'], ['won', 'lost'])) {
            $data['closed_at'] = null;
        }

        $lead->update($data);

        return redirect()->route('admin.leads.show', $lead)->with('success', 'Lead updated.');
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $lead->delete();

        return redirect()->route('admin.leads.index')->with('success', 'Lead deleted.');
    }
}
