<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_request_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_admin')->default(false);
            $table->text('message');
            $table->timestamps();

            $table->index(['service_request_id', 'created_at']);
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn('client_notes');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_request_messages');

        Schema::table('service_requests', function (Blueprint $table) {
            $table->text('client_notes')->nullable()->after('notes');
        });
    }
};
