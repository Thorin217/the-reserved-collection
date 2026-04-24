<?php

namespace App\Http\Controllers\Portal;

use App\Enums\CollectorVerificationStatus;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CollectorVerificationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->is_collector_verified) {
            return back()->with('error', 'Your account is already verified as a collector.');
        }

        $hasPending = $user->collectorVerificationRequests()
            ->where('status', CollectorVerificationStatus::Pending)
            ->exists();

        if ($hasPending) {
            return back()->with('error', 'You already have a pending verification request.');
        }

        $request->validate([
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $user->collectorVerificationRequests()->create([
            'status' => CollectorVerificationStatus::Pending,
            'message' => $request->message,
        ]);

        return back()->with('success', 'Your verification request has been submitted. We will review it shortly.');
    }
}
