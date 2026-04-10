<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_proposal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_proposal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_serial_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('model')->nullable();
            $table->decimal('suggested_price', 12, 2);
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('lead_proposal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_proposal_items');
    }
};
