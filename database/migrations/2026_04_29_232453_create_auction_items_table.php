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
        Schema::create('auction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('auction_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(1);
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_serial_id')->nullable()->constrained()->nullOnDelete();
            $table->string('inventory_source_type', 20);
            $table->decimal('reference_price', 12, 2)->nullable();
            $table->json('snapshot');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['auction_id', 'position']);
            $table->index(['product_variant_id', 'product_serial_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auction_items');
    }
};
