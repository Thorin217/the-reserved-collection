<?php

use App\Http\Controllers\Portal\AuctionHouseController;
use App\Http\Controllers\Portal\CartController;
use App\Http\Controllers\Portal\CatalogController;
use App\Http\Controllers\Portal\MyCollectionController;
use App\Http\Controllers\Portal\OrderController;
use App\Http\Controllers\Portal\PortalProfileController;
use App\Http\Controllers\Portal\ProposalPreviewController;
use App\Http\Controllers\Portal\WishlistController;
use Illuminate\Support\Facades\Route;

Route::name('portal.')->group(function () {
    // Signed proposal preview (no auth required, link expires)
    Route::get('proposals/{proposal}/preview', [ProposalPreviewController::class, 'show'])->name('proposals.preview');

    // Public routes
    Route::get('/', [CatalogController::class, 'featured'])->name('home');
    Route::get('catalog', [CatalogController::class, 'index'])->name('catalog');
    Route::get('products/{product:slug}', [CatalogController::class, 'show'])->name('products.show');
    Route::get('auction-house', [AuctionHouseController::class, 'index'])->name('auction-house');

    // Authenticated routes
    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('profile', [PortalProfileController::class, 'show'])->name('profile');
        Route::get('wishlist', [WishlistController::class, 'index'])->name('wishlist');
        Route::post('wishlist/{product}', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
        Route::get('my-collection', [MyCollectionController::class, 'index'])->name('my-collection');

        Route::get('cart', [CartController::class, 'index'])->name('cart');
        Route::post('cart', [CartController::class, 'store'])->name('cart.store');
        Route::patch('cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
        Route::delete('cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');
        Route::post('cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');

        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{sale}', [OrderController::class, 'show'])->name('orders.show');
    });
});
