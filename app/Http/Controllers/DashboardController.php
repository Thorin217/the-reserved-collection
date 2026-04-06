<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductSerial;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'products' => Product::count(),
                'active_products' => Product::where('status', 'active')->count(),
                'brands' => Brand::count(),
                'categories' => Category::count(),
                'serials_available' => ProductSerial::where('status', 'available')->count(),
                'serials_total' => ProductSerial::count(),
            ],
            'recent_products' => Product::with('brand')
                ->latest()
                ->limit(8)
                ->get(['id', 'name', 'sku', 'status', 'brand_id']),
        ]);
    }
}
