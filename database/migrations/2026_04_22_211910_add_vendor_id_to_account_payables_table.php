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
        Schema::table('account_payables', function (Blueprint $table) {
            if (! Schema::hasColumn('account_payables', 'vendor_id')) {
                $table->foreignId('vendor_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            } else {
                $table->foreign('vendor_id')->references('id')->on('vendors')->nullOnDelete();
            }
            $table->string('vendor_name')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('account_payables', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_id');
            $table->string('vendor_name')->nullable(false)->change();
        });
    }
};
