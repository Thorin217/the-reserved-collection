<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Resources\CollectorVerificationRequestResource;
use App\Http\Resources\ProductNegotiationResource;
use App\Models\Auction;
use App\Models\CollectorVerificationRequest;
use App\Models\ProductNegotiation;
use Inertia\Inertia;
use Inertia\Response;

class PortalProfileController extends Controller
{
    public function show(): Response
    {
        $user = request()->user();

        $latestVerification = CollectorVerificationRequest::where('user_id', $user->id)
            ->latest()
            ->first();

        $negotiations = ProductNegotiation::where('user_id', $user->id)
            ->with(['product.brand'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('portal/profile', [
            'auctionParticipationCount' => Auction::query()
                ->whereHas('bids', fn ($query) => $query->where('user_id', $user->id))
                ->count(),
            'collectorVerification' => $latestVerification
                ? CollectorVerificationRequestResource::make($latestVerification)
                : null,
            'negotiations' => ProductNegotiationResource::collection($negotiations),
        ]);
    }
}
