<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreNegotiationOfferRequest;
use App\Http\Requests\Admin\StoreNegotiationRequest;
use App\Http\Requests\Api\V1\UpdateNegotiationOfferRequest;
use App\Http\Requests\Api\V1\UpdateNegotiationRequest;
use App\Http\Resources\NegotiationOfferResource;
use App\Http\Resources\NegotiationResource;
use App\Models\Lead;
use App\Models\Negotiation;
use App\Models\NegotiationOffer;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NegotiationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', 'in:negotiating,agreed,rejected'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'lead_id' => ['nullable', 'integer', 'exists:leads,id'],
            'lead_proposal_id' => ['nullable', 'integer', 'exists:lead_proposals,id'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) $request->integer('per_page', 15);

        $negotiations = Negotiation::query()
            ->with(['lead.client', 'user', 'proposal'])
            ->withCount('offers')
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')))
            ->when($request->filled('user_id'), fn (Builder $query) => $query->where('user_id', $request->integer('user_id')))
            ->when($request->filled('lead_id'), fn (Builder $query) => $query->where('lead_id', $request->integer('lead_id')))
            ->when($request->filled('lead_proposal_id'), fn (Builder $query) => $query->where('lead_proposal_id', $request->integer('lead_proposal_id')))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(
            'Negotiations retrieved successfully.',
            NegotiationResource::collection($negotiations)->response()->getData(true)
        );
    }

    public function show(Request $request, Lead $lead, Negotiation $negotiation): JsonResponse
    {
        $validated = $request->validate([
            'include' => ['nullable', 'string'],
        ]);

        $includes = $this->parseIncludes($validated['include'] ?? null);

        $relations = ['user'];

        if (in_array('proposal', $includes, true)) {
            $relations[] = 'proposal.items.product';
        }

        if (in_array('offers', $includes, true)) {
            $relations['offers'] = fn ($query) => $query->with('user')->oldest();
        }

        if (in_array('lead', $includes, true)) {
            $relations[] = 'lead.client';
        }

        $negotiation->load($relations);
        $negotiation->loadCount('offers');

        return ApiResponse::success(
            'Negotiation retrieved successfully.',
            NegotiationResource::make($negotiation)->resolve()
        );
    }

    public function store(StoreNegotiationRequest $request, Lead $lead): JsonResponse
    {
        $validated = $request->validated();

        if (isset($validated['lead_proposal_id']) && ! $lead->proposals()->whereKey($validated['lead_proposal_id'])->exists()) {
            throw ValidationException::withMessages([
                'lead_proposal_id' => 'The selected proposal does not belong to this lead.',
            ]);
        }

        $negotiation = $lead->negotiations()->create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => 'negotiating',
        ]);

        $negotiation->load(['user', 'proposal']);
        $negotiation->loadCount('offers');

        return ApiResponse::success(
            'Negotiation created successfully.',
            NegotiationResource::make($negotiation)->resolve(),
            201
        );
    }

    public function update(UpdateNegotiationRequest $request, Lead $lead, Negotiation $negotiation): JsonResponse
    {
        $data = $request->validated();

        if ($data['status'] === 'agreed' && $negotiation->agreed_at === null) {
            $data['agreed_at'] = now();
            $lead->update(['status' => 'won', 'closed_at' => now()]);
        }

        $negotiation->update($data);
        $negotiation->load(['user', 'proposal']);
        $negotiation->loadCount('offers');

        return ApiResponse::success(
            'Negotiation updated successfully.',
            NegotiationResource::make($negotiation)->resolve()
        );
    }

    public function destroy(Lead $lead, Negotiation $negotiation): JsonResponse
    {
        $negotiation->delete();

        return ApiResponse::success('Negotiation deleted successfully.');
    }

    public function storeOffer(StoreNegotiationOfferRequest $request, Lead $lead, Negotiation $negotiation): JsonResponse
    {
        $offer = $negotiation->offers()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        $offer->load('user');

        return ApiResponse::success(
            'Negotiation offer created successfully.',
            NegotiationOfferResource::make($offer)->resolve(),
            201
        );
    }

    public function updateOffer(UpdateNegotiationOfferRequest $request, Lead $lead, Negotiation $negotiation, NegotiationOffer $offer): JsonResponse
    {
        $offer->update($request->validated());
        $offer->load('user');

        return ApiResponse::success(
            'Negotiation offer updated successfully.',
            NegotiationOfferResource::make($offer)->resolve()
        );
    }

    public function destroyOffer(Lead $lead, Negotiation $negotiation, NegotiationOffer $offer): JsonResponse
    {
        $offer->delete();

        return ApiResponse::success('Negotiation offer deleted successfully.');
    }

    /**
     * @return array<int, string>
     */
    private function parseIncludes(?string $include): array
    {
        if ($include === null || trim($include) === '') {
            return [];
        }

        return collect(explode(',', $include))
            ->map(fn (string $value): string => trim($value))
            ->filter(fn (string $value): bool => in_array($value, ['lead', 'proposal', 'offers', 'user'], true))
            ->unique()
            ->values()
            ->all();
    }
}
