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
        Schema::create('price_update_filters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_update_id');
            $table->enum('entity_level', ['product', 'variant', 'serial']);
            $table->foreignId('attribute_id')->constrained('attributes')->restrictOnDelete();
            $table->foreignId('attribute_option_id')->nullable()->constrained('attribute_options')->nullOnDelete();
            $table->timestamps();

            $table->index(['price_update_id', 'entity_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_update_filters');
    }
};
