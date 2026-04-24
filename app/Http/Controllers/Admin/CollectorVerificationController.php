<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CollectorVerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CollectorVerificationRequestResource;
use App\Models\CollectorVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CollectorVerificationController extends Controller
{
    public function index(Request $request): Response
    {
        $requests = QueryBuilder::for(CollectorVerificationRequest::class)
            ->allowedFilters(
                AllowedFilter::exact('status'),
            )
            ->with(['user', 'reviewer'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/collector-verifications/index', [
            'requests' => CollectorVerificationRequestResource::collection($requests),
            'filters' => $request->only(['filter']),
        ]);
    }

    public function approve(Request $request, CollectorVerificationRequest $collectorVerification): RedirectResponse
    {
        abort_if($collectorVerification->status !== CollectorVerificationStatus::Pending, 422, 'This request has already been reviewed.');

        $collectorVerification->update([
            'status' => CollectorVerificationStatus::Approved,
            'admin_notes' => $request->admin_notes,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $collectorVerification->user->update(['is_collector_verified' => true]);

        return back()->with('success', 'Collector verified. The user can now access live negotiations.');
    }

    public function reject(Request $request, CollectorVerificationRequest $collectorVerification): RedirectResponse
    {
        abort_if($collectorVerification->status !== CollectorVerificationStatus::Pending, 422, 'This request has already been reviewed.');

        $request->validate([
            'admin_notes' => ['required', 'string', 'max:1000'],
        ]);

        $collectorVerification->update([
            'status' => CollectorVerificationStatus::Rejected,
            'admin_notes' => $request->admin_notes,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Verification request rejected.');
    }
}
