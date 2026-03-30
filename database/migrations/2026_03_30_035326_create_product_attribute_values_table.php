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
        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('product_variant_id')->nullable()->constrained()->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('product_serial_id')->nullable()->constrained()->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('attribute_id')->constrained()->onDelete('cascade')->onUpdate('cascade');
            $table->string('value_text')->nullable();
            $table->text('value_textarea')->nullable();
            $table->integer('value_number')->nullable();
            $table->decimal('value_decimal', 16, 8)->nullable();
            $table->boolean('value_boolean')->nullable();
            $table->date('value_date')->nullable();
            $table->foreignId('attribute_option_id')->nullable()->constrained('attribute_options')->onDelete('set null')->onUpdate('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_attribute_values');
    }
};
