<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreClientRequest;
use App\Http\Requests\Admin\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $clients = Client::withCount('leads')
            ->with('user')
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"))
            ->when($request->status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($request->status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('crm/clients/index', [
            'clients' => ClientResource::collection($clients),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function show(Client $client): Response
    {
        $client
            ->loadCount(['leads', 'quotes', 'sales'])
            ->load([
                'user',
                'leads',
                'accountReceivables' => fn ($query) => $query->latest('id'),
            ]);

        return Inertia::render('crm/clients/show', [
            'client' => ClientResource::make($client),
        ]);
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        Client::create($request->validated());

        return redirect()->route('admin.clients.index')->with('success', 'Cliente creado exitosamente.');
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('crm/clients/edit', [
            'client' => ClientResource::make($client),
        ]);
    }

    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        return redirect()->route('admin.clients.index')->with('success', 'Cliente actualizado.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return redirect()->route('admin.clients.index')->with('success', 'Cliente eliminado.');
    }
}
