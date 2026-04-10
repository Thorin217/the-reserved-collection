<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalProfileController extends Controller
{
    public function show(Request $request): Response
    {
        $userId = $request->user()->id;

        return Inertia::render('portal/profile', [
            'wishlistCount' => Wishlist::where('user_id', $userId)->count(),
            'cartCount' => CartItem::where('user_id', $userId)->sum('quantity'),
        ]);
    }
}
