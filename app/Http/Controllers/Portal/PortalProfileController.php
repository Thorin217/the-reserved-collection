<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use Inertia\Inertia;
use Inertia\Response;

class PortalProfileController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('portal/profile', [
            'auctionParticipationCount' => Auction::query()
                ->whereHas('bids', fn ($query) => $query->where('user_id', request()->user()->id))
                ->count(),
        ]);
    }
}
