<?php

use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Admin\LeadInteractionController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductSerialController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Inventario - Productos
    Route::resource('products', ProductController::class)->except(['show', 'create', 'store'])->only(['index', 'edit', 'update', 'destroy']);
    Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');

    // Seriales (trazabilidad)
    Route::prefix('products/{product}/serials')->name('products.serials.')->group(function () {
        Route::get('/', [ProductSerialController::class, 'index'])->name('index');
        Route::post('/', [ProductSerialController::class, 'store'])->name('store');
        Route::put('{serial}', [ProductSerialController::class, 'update'])->name('update');
        Route::delete('{serial}', [ProductSerialController::class, 'destroy'])->name('destroy');
    });

    // Marcas
    Route::get('brands', [BrandController::class, 'index'])->name('brands.index');
    Route::post('brands', [BrandController::class, 'store'])->name('brands.store');
    Route::put('brands/{brand}', [BrandController::class, 'update'])->name('brands.update');
    Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->name('brands.destroy');

    // Categorías
    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    // CRM - Clientes
    Route::get('clients', [ClientController::class, 'index'])->name('clients.index');
    Route::post('clients', [ClientController::class, 'store'])->name('clients.store');
    Route::get('clients/{client}/edit', [ClientController::class, 'edit'])->name('clients.edit');
    Route::put('clients/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::delete('clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');

    // CRM - Leads
    Route::get('leads', [LeadController::class, 'index'])->name('leads.index');
    Route::post('leads', [LeadController::class, 'store'])->name('leads.store');
    Route::get('leads/{lead}', [LeadController::class, 'show'])->name('leads.show');
    Route::put('leads/{lead}', [LeadController::class, 'update'])->name('leads.update');
    Route::delete('leads/{lead}', [LeadController::class, 'destroy'])->name('leads.destroy');

    // CRM - Lead Interactions
    Route::post('leads/{lead}/interactions', [LeadInteractionController::class, 'store'])->name('leads.interactions.store');
    Route::delete('leads/{lead}/interactions/{interaction}', [LeadInteractionController::class, 'destroy'])->name('leads.interactions.destroy');
});
