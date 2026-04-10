<?php

use App\Http\Controllers\Portal\CartController;
use App\Http\Controllers\Portal\CatalogController;
use App\Http\Controllers\Portal\PortalProfileController;
use App\Http\Controllers\Portal\WishlistController;
use Illuminate\Support\Facades\Route;

Route::name('portal.')->group(function () {
    // Public routes
    Route::get('/', [CatalogController::class, 'featured'])->name('home');
    Route::get('catalog', [CatalogController::class, 'index'])->name('catalog');
    Route::get('products/{product:slug}', [CatalogController::class, 'show'])->name('products.show');

    // Authenticated routes
    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('profile', [PortalProfileController::class, 'show'])->name('profile');
        Route::get('wishlist', [WishlistController::class, 'index'])->name('wishlist');
        Route::post('wishlist/{product}', [WishlistController::class, 'toggle'])->name('wishlist.toggle');

        Route::get('cart', [CartController::class, 'index'])->name('cart');
        Route::post('cart', [CartController::class, 'store'])->name('cart.store');
        Route::patch('cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
        Route::delete('cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');
    });
});
