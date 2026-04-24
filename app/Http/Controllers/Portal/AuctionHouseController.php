<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Inertia\Response;

class AuctionHouseController extends Controller
{
    public function index(): Response
    {
        return app(AuctionController::class)->index(request());
    }
}
