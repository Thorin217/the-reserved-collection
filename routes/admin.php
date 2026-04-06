<?php

use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CategoryController;
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
});
