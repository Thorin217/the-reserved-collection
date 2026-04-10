<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('negotiation_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('negotiation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30)->comment('our_offer, client_counteroffer');
            $table->decimal('amount', 12, 2);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['negotiation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('negotiation_offers');
    }
};
