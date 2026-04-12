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
        Schema::create('attribute_entity_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained()->cascadeOnDelete();
            $table->enum('entity_level', ['product', 'variant', 'serial']);
            $table->timestamps();

            $table->unique(['attribute_id', 'entity_level']);
            $table->index('entity_level');
        });

        DB::table('attributes')
            ->select(['id', 'entity_level'])
            ->orderBy('id')
            ->chunkById(200, function ($attributes): void {
                $rows = $attributes
                    ->map(fn ($attribute): array => [
                        'attribute_id' => $attribute->id,
                        'entity_level' => $attribute->entity_level,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                    ->all();

                if ($rows !== []) {
                    DB::table('attribute_entity_levels')->insert($rows);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attribute_entity_levels');
    }
};
