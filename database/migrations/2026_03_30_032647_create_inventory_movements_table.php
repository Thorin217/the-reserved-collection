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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->enum('movement_type', [
                'opening',
                'purchase',
                'sale',
                'sale_return',
                'purchase_return',
                'transfer_out',
                'transfer_in',
                'adjustment_in',
                'adjustment_out',
                'reservation',
                'reservation_release',
                'damage',
                'loss',
            ]);
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');
            $table->foreignId('serial_id')->nullable()->constrained('product_serials')->onDelete('set null');
            $table->decimal('quantity', 16, 8)->nullable();
            $table->decimal('unit_cost', 16, 8)->nullable();
            $table->decimal('balance_after_movement', 16, 8)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
