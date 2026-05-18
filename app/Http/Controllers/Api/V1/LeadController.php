<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeadRequest;
use App\Http\Requests\Admin\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:new,contacted,negotiating,won,lost'],
            'source' => ['nullable', 'in:whatsapp,web,referral,social,walk_in,other'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort' => ['nullable', 'in:title,created_at,updated_at,closed_at,expected_value'],
            'direction' => ['nullable', 'in:asc,desc'],
        ]);

        $sort = $validated['sort'] ?? 'created_at';
        $direction = $validated['direction'] ?? 'desc';
        $perPage = (int) ($validated['per_page'] ?? 15);

        $leads = Lead::query()
            ->with(['client', 'assignedUser'])
            ->withCount('interactions')
            ->when(isset($validated['search']), function (Builder $query) use ($validated): void {
                $search = $validated['search'];

                $query->where(function (Builder $searchQuery) use ($search): void {
                    $searchQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhereHas('client', fn (Builder $clientQuery) => $clientQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->when(isset($validated['status']), fn (Builder $query) => $query->where('status', $validated['status']))
            ->when(isset($validated['source']), fn (Builder $query) => $query->where('source', $validated['source']))
            ->when(isset($validated['assigned_to']), fn (Builder $query) => $query->where('assigned_to', $validated['assigned_to']))
            ->when(isset($validated['client_id']), fn (Builder $query) => $query->where('client_id', $validated['client_id']))
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(
            'Leads retrieved successfully.',
            LeadResource::collection($leads)->response()->getData(true)
        );
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = Lead::create($request->validated());
        $lead->load(['client', 'assignedUser']);

        return ApiResponse::success(
            'Lead created successfully.',
            LeadResource::make($lead)->resolve(),
            201
        );
    }

    public function show(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'include' => ['nullable', 'string'],
        ]);

        $includes = $this->parseIncludes($validated['include'] ?? null);

        $relations = ['client', 'assignedUser'];

        if (in_array('interactions', $includes, true)) {
            $relations['interactions'] = fn ($query) => $query->with('user')->latest('interacted_at');
        }

        if (in_array('proposals', $includes, true)) {
            $relations['proposals'] = fn ($query) => $query->with('user')->withCount('items')->latest();
        }

        if (in_array('negotiations', $includes, true)) {
            $relations['negotiations'] = fn ($query) => $query->with('user')->withCount('offers')->latest();
        }

        $lead->load($relations);
        $lead->loadCount('interactions');

        return ApiResponse::success(
            'Lead retrieved successfully.',
            LeadResource::make($lead)->resolve()
        );
    }

    public function update(UpdateLeadRequest $request, Lead $lead): JsonResponse
    {
        $data = $request->validated();

        if (in_array($data['status'], ['won', 'lost'], true) && $lead->closed_at === null) {
            $data['closed_at'] = now();
        } elseif (! in_array($data['status'], ['won', 'lost'], true)) {
            $data['closed_at'] = null;
        }

        $lead->update($data);
        $lead->load(['client', 'assignedUser']);

        return ApiResponse::success(
            'Lead updated successfully.',
            LeadResource::make($lead)->resolve()
        );
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();

        return ApiResponse::success('Lead deleted successfully.');
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
            ->filter(fn (string $value): bool => in_array($value, ['client', 'assigned_user', 'interactions', 'proposals', 'negotiations'], true))
            ->map(fn (string $value): string => $value === 'assigned_user' ? 'assignedUser' : $value)
            ->unique()
            ->values()
            ->all();
    }
}
