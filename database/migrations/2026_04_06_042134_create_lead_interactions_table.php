<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30)->default('other')->comment('call, email, visit, whatsapp, other');
            $table->text('notes');
            $table->timestamp('interacted_at');
            $table->timestamps();

            $table->index(['lead_id', 'interacted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_interactions');
    }
};
