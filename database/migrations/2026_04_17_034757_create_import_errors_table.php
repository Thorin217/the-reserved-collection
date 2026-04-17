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
        Schema::create('import_errors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('import_id')->constrained('imports')->cascadeOnDelete();
            $table->unsignedInteger('row_number')->nullable();
            $table->string('attribute')->nullable();
            $table->string('value')->nullable();
            $table->string('error_code', 100);
            $table->text('message');
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['import_id', 'row_number']);
            $table->index(['import_id', 'error_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_errors');
    }
};
