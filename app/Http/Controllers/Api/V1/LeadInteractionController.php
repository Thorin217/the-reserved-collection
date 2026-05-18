<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeadInteractionRequest;
use App\Http\Resources\LeadInteractionResource;
use App\Models\Lead;
use App\Models\LeadInteraction;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class LeadInteractionController extends Controller
{
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
