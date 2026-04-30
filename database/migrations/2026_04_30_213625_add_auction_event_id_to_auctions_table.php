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
        Schema::table('auctions', function (Blueprint $table) {
            $table->foreignId('auction_event_id')
                ->nullable()
                ->after('id')
                ->constrained('auction_events')
                ->nullOnDelete();
            $table->unsignedInteger('sequence')->nullable()->after('auction_event_id');
        });

        $timestamp = now();

        DB::table('auctions')
            ->orderBy('id')
            ->get()
            ->each(function (object $auction) use ($timestamp): void {
                $eventId = DB::table('auction_events')->insertGetId([
                    'title' => $auction->title,
                    'slug' => $auction->slug,
                    'description' => $auction->description,
                    'format' => 'lot',
                    'status' => $auction->status,
                    'starts_at' => $auction->starts_at,
                    'ends_at' => $auction->ends_at,
                    'hero_image_url' => $auction->hero_image_url,
                    'notes' => $auction->notes,
                    'created_by' => $auction->created_by,
                    'closed_by' => $auction->closed_by,
                    'closed_at' => $auction->closed_at,
                    'created_at' => $auction->created_at ?? $timestamp,
                    'updated_at' => $auction->updated_at ?? $timestamp,
                ]);

                DB::table('auctions')
                    ->where('id', $auction->id)
                    ->update([
                        'auction_event_id' => $eventId,
                        'sequence' => 1,
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('auction_event_id');
            $table->dropColumn('sequence');
        });
    }
};
