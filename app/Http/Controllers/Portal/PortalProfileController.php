<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PortalProfileController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('portal/profile');
    }
}
