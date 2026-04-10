<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('negotiations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_proposal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('negotiating')->comment('negotiating, agreed, rejected');
            $table->decimal('initial_price', 12, 2);
            $table->decimal('final_price', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('agreed_at')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('negotiations');
    }
};
