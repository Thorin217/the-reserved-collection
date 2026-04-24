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
        Schema::create('product_negotiation_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_negotiation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('note');
            $table->decimal('amount', 15, 2)->nullable();
            $table->text('message')->nullable();
            $table->timestamps();

            $table->index(['product_negotiation_id', 'created_at'], 'pnm_negotiation_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_negotiation_messages');
    }
};
