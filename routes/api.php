<?php

use App\Http\Controllers\Api\V1\Inventory\ProductInventoryController;
use App\Http\Controllers\Api\V1\Inventory\ProductSerialController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadInteractionController;
use App\Http\Controllers\Api\V1\LeadProposalController;
use App\Http\Controllers\Api\V1\NegotiationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::prefix('v1')->scopeBindings()->group(function (): void {
        Route::prefix('inventory')->group(function (): void {
            Route::get('/products', [ProductInventoryController::class, 'index']);
            Route::post('/products', [ProductInventoryController::class, 'store']);
            Route::post('/products/{product}/serials', [ProductSerialController::class, 'store']);
        });

        Route::get('/leads', [LeadController::class, 'index']);
        Route::post('/leads', [LeadController::class, 'store']);
        Route::get('/leads/{lead}', [LeadController::class, 'show']);
        Route::patch('/leads/{lead}', [LeadController::class, 'update']);
        Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);

        Route::post('/leads/{lead}/interactions', [LeadInteractionController::class, 'store']);
        Route::delete('/leads/{lead}/interactions/{interaction}', [LeadInteractionController::class, 'destroy']);

        Route::get('/proposals', [LeadProposalController::class, 'index']);
        Route::get('/leads/{lead}/proposals/{proposal}', [LeadProposalController::class, 'show']);
        Route::post('/leads/{lead}/proposals', [LeadProposalController::class, 'store']);
        Route::post('/leads/{lead}/proposals/{proposal}/send', [LeadProposalController::class, 'send']);
        Route::delete('/leads/{lead}/proposals/{proposal}', [LeadProposalController::class, 'destroy']);

        Route::get('/negotiations', [NegotiationController::class, 'index']);
        Route::get('/leads/{lead}/negotiations/{negotiation}', [NegotiationController::class, 'show']);
        Route::post('/leads/{lead}/negotiations', [NegotiationController::class, 'store']);
        Route::patch('/leads/{lead}/negotiations/{negotiation}', [NegotiationController::class, 'update']);
        Route::delete('/leads/{lead}/negotiations/{negotiation}', [NegotiationController::class, 'destroy']);
        Route::post('/leads/{lead}/negotiations/{negotiation}/offers', [NegotiationController::class, 'storeOffer']);
        Route::delete('/leads/{lead}/negotiations/{negotiation}/offers/{offer}', [NegotiationController::class, 'destroyOffer']);
    });
});
