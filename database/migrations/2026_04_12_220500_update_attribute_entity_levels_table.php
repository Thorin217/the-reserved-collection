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
        Schema::table('attribute_entity_levels', function (Blueprint $table): void {
            if (! Schema::hasColumn('attribute_entity_levels', 'attribute_id')) {
                $table->foreignId('attribute_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('attribute_entity_levels', 'entity_level')) {
                $table->enum('entity_level', ['product', 'variant', 'serial'])->nullable()->after('attribute_id');
            }
        });

        if (Schema::hasColumn('attribute_entity_levels', 'attribute_id') && Schema::hasColumn('attribute_entity_levels', 'entity_level')) {
            $rows = DB::table('attributes')
                ->select(['id', 'entity_level'])
                ->orderBy('id')
                ->get()
                ->map(fn ($attribute): array => [
                    'attribute_id' => $attribute->id,
                    'entity_level' => $attribute->entity_level,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
                ->all();

            if ($rows !== []) {
                DB::table('attribute_entity_levels')->upsert($rows, ['attribute_id', 'entity_level'], ['updated_at']);
            }
        }

        try {
            Schema::table('attribute_entity_levels', function (Blueprint $table): void {
                $table->unique(['attribute_id', 'entity_level'], 'attribute_entity_levels_attribute_id_entity_level_unique');
            });
        } catch (Throwable) {
            // Index may already exist in fresh installs.
        }

        try {
            Schema::table('attribute_entity_levels', function (Blueprint $table): void {
                $table->index('entity_level', 'attribute_entity_levels_entity_level_index');
            });
        } catch (Throwable) {
            // Index may already exist in fresh installs.
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attribute_entity_levels', function (Blueprint $table): void {
            $table->dropUnique('attribute_entity_levels_attribute_id_entity_level_unique');
            $table->dropIndex('attribute_entity_levels_entity_level_index');
        });
    }
};
