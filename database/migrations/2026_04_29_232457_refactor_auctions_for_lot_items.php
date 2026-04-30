<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('auctions')
            ->orderBy('id')
            ->get()
            ->each(function (object $auction): void {
                if ($auction->product_id === null || $auction->product_variant_id === null) {
                    return;
                }

                DB::table('auction_items')->insert([
                    'auction_id' => $auction->id,
                    'position' => 1,
                    'product_id' => $auction->product_id,
                    'product_variant_id' => $auction->product_variant_id,
                    'product_serial_id' => $auction->product_serial_id,
                    'inventory_source_type' => $auction->inventory_source_type,
                    'reference_price' => data_get(json_decode($auction->inventory_snapshot ?? '[]', true), 'price_reference'),
                    'snapshot' => $auction->inventory_snapshot ?? json_encode([]),
                    'notes' => null,
                    'created_at' => $auction->created_at,
                    'updated_at' => $auction->updated_at,
                ]);
            });

        Schema::table('auctions', function (Blueprint $table) {
            $table->string('hero_image_url')->nullable()->after('lot_number');
        });

        DB::table('auctions')
            ->select(['id', 'inventory_snapshot'])
            ->orderBy('id')
            ->get()
            ->each(function (object $auction): void {
                $snapshot = json_decode($auction->inventory_snapshot ?? '[]', true);

                DB::table('auctions')
                    ->where('id', $auction->id)
                    ->update([
                        'hero_image_url' => data_get($snapshot, 'image_url'),
                    ]);
            });

        Schema::table('auctions', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropForeign(['product_variant_id']);
            $table->dropForeign(['product_serial_id']);
            $table->dropColumn(['product_id', 'product_variant_id', 'product_serial_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->after('closure_result')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->after('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_serial_id')->nullable()->after('product_variant_id')->constrained()->nullOnDelete();
        });

        DB::table('auctions')
            ->orderBy('id')
            ->get()
            ->each(function (object $auction): void {
                $item = DB::table('auction_items')
                    ->where('auction_id', $auction->id)
                    ->orderBy('position')
                    ->first();

                if ($item === null) {
                    return;
                }

                DB::table('auctions')
                    ->where('id', $auction->id)
                    ->update([
                        'product_id' => $item->product_id,
                        'product_variant_id' => $item->product_variant_id,
                        'product_serial_id' => $item->product_serial_id,
                    ]);
            });

        Schema::table('auctions', function (Blueprint $table) {
            $table->dropColumn('hero_image_url');
        });
    }
};
