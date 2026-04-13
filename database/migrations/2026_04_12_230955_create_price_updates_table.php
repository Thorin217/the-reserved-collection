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
        Schema::create('price_updates', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->text('notes')->nullable();
            $table->string('change_type', 30);
            $table->decimal('change_value', 12, 6);
            $table->unsignedInteger('affected_variants_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_updates');
    }
};
