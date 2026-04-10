<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft')->comment('draft, sent, viewed, accepted, rejected');
            $table->string('sent_via', 20)->nullable()->comment('whatsapp, email');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_proposals');
    }
};
