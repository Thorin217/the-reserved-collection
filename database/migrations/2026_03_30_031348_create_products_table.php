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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('brand_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('product_type', ['simple', 'variant', 'serializable'])->default('variant');
            $table->boolean('track_stock')->default(true);
            $table->boolean('has_serial_numbers')->default(false);
            $table->enum('status', ['draft','active','inactive'])->default('draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
