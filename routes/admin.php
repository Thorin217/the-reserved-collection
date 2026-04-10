<?php

use App\Http\Controllers\Admin\BranchController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\InventoryAdjustmentController;
use App\Http\Controllers\Admin\InventoryMovementController;
use App\Http\Controllers\Admin\InventoryReservationController;
use App\Http\Controllers\Admin\InventoryStockController;
use App\Http\Controllers\Admin\InventoryTransferController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Admin\LeadInteractionController;
use App\Http\Controllers\Admin\LeadProposalController;
use App\Http\Controllers\Admin\NegotiationController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductSerialController;
use App\Http\Controllers\Admin\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Inventario - Productos
    Route::resource('products', ProductController::class)
        ->except(['show', 'create', 'store'])
        ->only(['index', 'edit', 'update', 'destroy']);

    Route::prefix('products')->name('products.')->group(function () {
        Route::get('create', [ProductController::class, 'create'])->name('create');
        Route::post('/', [ProductController::class, 'store'])->name('store');

        // Seriales (trazabilidad)
        Route::prefix('{product}/serials')->name('serials.')->group(function () {
            Route::get('/', [ProductSerialController::class, 'index'])->name('index');
            Route::post('/', [ProductSerialController::class, 'store'])->name('store');
            Route::put('{serial}', [ProductSerialController::class, 'update'])->name('update');
            Route::delete('{serial}', [ProductSerialController::class, 'destroy'])->name('destroy');
        });
    });

    // Inventario - Core fase 1
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('stocks', [InventoryStockController::class, 'index'])->name('stocks.index');
        Route::get('movements', [InventoryMovementController::class, 'index'])->name('movements.index');

        Route::prefix('transfers')->name('transfers.')->group(function () {
            Route::get('/', [InventoryTransferController::class, 'index'])->name('index');
            Route::post('/', [InventoryTransferController::class, 'store'])->name('store');
            Route::put('{inventoryTransfer}', [InventoryTransferController::class, 'update'])->name('update');
            Route::delete('{inventoryTransfer}', [InventoryTransferController::class, 'destroy'])->name('destroy');
            Route::post('{inventoryTransfer}/send', [InventoryTransferController::class, 'send'])->name('send');
            Route::post('{inventoryTransfer}/receive', [InventoryTransferController::class, 'receive'])->name('receive');
        });

        Route::prefix('adjustments')->name('adjustments.')->group(function () {
            Route::get('/', [InventoryAdjustmentController::class, 'index'])->name('index');
            Route::post('/', [InventoryAdjustmentController::class, 'store'])->name('store');
            Route::put('{inventoryAdjustment}', [InventoryAdjustmentController::class, 'update'])->name('update');
            Route::delete('{inventoryAdjustment}', [InventoryAdjustmentController::class, 'destroy'])->name('destroy');
            Route::post('{inventoryAdjustment}/confirm', [InventoryAdjustmentController::class, 'confirm'])->name('confirm');
            Route::post('{inventoryAdjustment}/cancel', [InventoryAdjustmentController::class, 'cancel'])->name('cancel');
        });

        Route::prefix('reservations')->name('reservations.')->group(function () {
            Route::get('/', [InventoryReservationController::class, 'index'])->name('index');
            Route::post('/', [InventoryReservationController::class, 'store'])->name('store');
            Route::post('{inventoryReservation}/release', [InventoryReservationController::class, 'release'])->name('release');
            Route::post('{inventoryReservation}/consume', [InventoryReservationController::class, 'consume'])->name('consume');
            Route::post('{inventoryReservation}/cancel', [InventoryReservationController::class, 'cancel'])->name('cancel');
        });
    });

    Route::prefix('brands')->name('brands.')->group(function () {
        Route::get('/', [BrandController::class, 'index'])->name('index');
        Route::post('/', [BrandController::class, 'store'])->name('store');
        Route::put('{brand}', [BrandController::class, 'update'])->name('update');
        Route::delete('{brand}', [BrandController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('categories')->name('categories.')->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->name('index');
        Route::post('/', [CategoryController::class, 'store'])->name('store');
        Route::put('{category}', [CategoryController::class, 'update'])->name('update');
        Route::delete('{category}', [CategoryController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('branches')->name('branches.')->group(function () {
        Route::get('/', [BranchController::class, 'index'])->name('index');
        Route::get('create', [BranchController::class, 'create'])->name('create');
        Route::post('/', [BranchController::class, 'store'])->name('store');
        Route::get('{branch}/edit', [BranchController::class, 'edit'])->name('edit');
        Route::put('{branch}', [BranchController::class, 'update'])->name('update');
        Route::delete('{branch}', [BranchController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('warehouses')->name('warehouses.')->group(function () {
        Route::get('/', [WarehouseController::class, 'index'])->name('index');
        Route::get('create', [WarehouseController::class, 'create'])->name('create');
        Route::post('/', [WarehouseController::class, 'store'])->name('store');
        Route::get('{warehouse}/edit', [WarehouseController::class, 'edit'])->name('edit');
        Route::put('{warehouse}', [WarehouseController::class, 'update'])->name('update');
        Route::delete('{warehouse}', [WarehouseController::class, 'destroy'])->name('destroy');
    });

    // CRM
    Route::prefix('clients')->name('clients.')->group(function () {
        Route::get('/', [ClientController::class, 'index'])->name('index');
        Route::post('/', [ClientController::class, 'store'])->name('store');
        Route::get('{client}/edit', [ClientController::class, 'edit'])->name('edit');
        Route::put('{client}', [ClientController::class, 'update'])->name('update');
        Route::delete('{client}', [ClientController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('leads')->name('leads.')->group(function () {
        Route::get('/', [LeadController::class, 'index'])->name('index');
        Route::post('/', [LeadController::class, 'store'])->name('store');
        Route::get('{lead}', [LeadController::class, 'show'])->name('show');
        Route::put('{lead}', [LeadController::class, 'update'])->name('update');
        Route::delete('{lead}', [LeadController::class, 'destroy'])->name('destroy');

        Route::prefix('{lead}/interactions')->name('interactions.')->group(function () {
            Route::post('/', [LeadInteractionController::class, 'store'])->name('store');
            Route::delete('{interaction}', [LeadInteractionController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('{lead}/proposals')->name('proposals.')->group(function () {
            Route::get('create', [LeadProposalController::class, 'create'])->name('create');
            Route::post('/', [LeadProposalController::class, 'store'])->name('store');
            Route::post('{proposal}/send', [LeadProposalController::class, 'send'])->name('send');
            Route::delete('{proposal}', [LeadProposalController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('{lead}/negotiations')->name('negotiations.')->group(function () {
            Route::post('/', [NegotiationController::class, 'store'])->name('store');
            Route::get('{negotiation}', [NegotiationController::class, 'show'])->name('show');
            Route::put('{negotiation}', [NegotiationController::class, 'update'])->name('update');
            Route::delete('{negotiation}', [NegotiationController::class, 'destroy'])->name('destroy');
            Route::post('{negotiation}/offers', [NegotiationController::class, 'storeOffer'])->name('offers.store');
            Route::delete('{negotiation}/offers/{offer}', [NegotiationController::class, 'destroyOffer'])->name('offers.destroy');
        });
    });
});
