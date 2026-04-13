<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('price_update_filters', function (Blueprint $table): void {
            $table->foreign('price_update_id')
                ->references('id')
                ->on('price_updates')
                ->cascadeOnDelete();
        });

        Schema::create('price_update_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_update_id')->constrained('price_updates')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->decimal('old_price', 16, 8);
            $table->decimal('new_price', 16, 8);
            $table->decimal('delta_price', 16, 8);
            $table->timestamps();

            $table->index(['price_update_id', 'product_variant_id']);
            $table->unique(['price_update_id', 'product_variant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_update_items');

        Schema::table('price_update_filters', function (Blueprint $table): void {
            $table->dropForeign(['price_update_id']);
        });
    }
};
