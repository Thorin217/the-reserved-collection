<?php

use App\Http\Controllers\Portal\AuctionBidController;
use App\Http\Controllers\Portal\AuctionController;
use App\Http\Controllers\Portal\AuctionHouseController;
use App\Http\Controllers\Portal\CartController;
use App\Http\Controllers\Portal\CatalogController;
use App\Http\Controllers\Portal\CollectorVerificationController;
use App\Http\Controllers\Portal\MyCollectionController;
use App\Http\Controllers\Portal\OrderController;
use App\Http\Controllers\Portal\PortalProfileController;
use App\Http\Controllers\Portal\ProductNegotiationController;
use App\Http\Controllers\Portal\ProposalPreviewController;
use App\Http\Controllers\Portal\SearchController;
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
    Route::get('auctions/{auction:slug}', [AuctionController::class, 'show'])->name('auctions.show');
    Route::get('search', SearchController::class)->name('search');

    // Authenticated routes
    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('profile', [PortalProfileController::class, 'show'])->name('profile');
        Route::get('profile/auctions', [AuctionController::class, 'participations'])->name('profile.auctions');
        Route::get('profile/auctions/{auction:slug}', [AuctionController::class, 'participationShow'])->name('profile.auctions.show');
        Route::get('wishlist', [WishlistController::class, 'index'])->name('wishlist');
        Route::post('wishlist/{product}', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
        Route::get('my-collection', [MyCollectionController::class, 'index'])->name('my-collection');
        Route::post('auctions/{auction}/bids', [AuctionBidController::class, 'store'])->name('auctions.bids.store');

        Route::get('cart', [CartController::class, 'index'])->name('cart');
        Route::post('cart', [CartController::class, 'store'])->name('cart.store');
        Route::patch('cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
        Route::delete('cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');
        Route::post('cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');

        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{sale}', [OrderController::class, 'show'])->name('orders.show');

        // Collector Verification
        Route::post('collector-verification', [CollectorVerificationController::class, 'store'])->name('collector-verification.store');

        // Product Negotiations
        Route::post('products/{product}/negotiations', [ProductNegotiationController::class, 'store'])->name('product-negotiations.store');
        Route::get('negotiations/{productNegotiation}', [ProductNegotiationController::class, 'show'])->name('negotiations.show');
        Route::post('negotiations/{productNegotiation}/messages', [ProductNegotiationController::class, 'storeMessage'])->name('negotiations.messages.store');
    });
});
