<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeadInteractionRequest;
use App\Http\Resources\LeadInteractionResource;
use App\Models\Lead;
use App\Models\LeadInteraction;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadInteractionController extends Controller
{
    public function index(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 15);

        $interactions = $lead->interactions()
            ->with('user')
            ->latest('interacted_at')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(
            'Lead interactions retrieved successfully.',
            LeadInteractionResource::collection($interactions)->response()->getData(true)
        );
    }

    public function store(StoreLeadInteractionRequest $request, Lead $lead): JsonResponse
    {
        $interaction = $lead->interactions()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'interacted_at' => now(),
        ]);

        $interaction->load('user');

        return ApiResponse::success(
            'Lead interaction created successfully.',
            LeadInteractionResource::make($interaction)->resolve(),
            201
        );
    }

    public function destroy(Lead $lead, LeadInteraction $interaction): JsonResponse
    {
        $interaction->delete();

        return ApiResponse::success('Lead interaction deleted successfully.');
    }
}
