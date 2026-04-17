<?php

namespace App\Models;

use App\Enums\ImportStatus;
use App\Enums\ImportType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Import extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'status',
        'file_path',
        'total_rows',
        'processed_rows',
        'successful_rows',
        'failed_rows',
        'started_at',
        'finished_at',
        'meta',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'type' => ImportType::class,
        'status' => ImportStatus::class,
        'total_rows' => 'integer',
        'processed_rows' => 'integer',
        'successful_rows' => 'integer',
        'failed_rows' => 'integer',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'meta' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function errors(): HasMany
    {
        return $this->hasMany(ImportError::class);
    }

    public function incrementProcessedRows(int $amount = 1): void
    {
        $this->increment('processed_rows', $amount);
    }

    public function incrementSuccessfulRows(int $amount = 1): void
    {
        $this->increment('successful_rows', $amount);
    }

    public function incrementFailedRows(int $amount = 1): void
    {
        $this->increment('failed_rows', $amount);
    }

    public function mergeMeta(array $meta): void
    {
        $currentMeta = $this->meta ?? [];

        $this->update([
            'meta' => array_merge($currentMeta, $meta),
        ]);
    }

    public function markAsProcessing(): void
    {
        $this->update([
            'status' => ImportStatus::Processing,
            'started_at' => now(),
        ]);
    }

    public function markAsCompleted(): void
    {
        $resolvedStatus = $this->failed_rows > 0
            ? ImportStatus::CompletedWithErrors
            : ImportStatus::Completed;

        $this->update([
            'status' => $resolvedStatus,
            'finished_at' => now(),
        ]);
    }

    public function markAsFailed(string $reason): void
    {
        DB::transaction(function () use ($reason): void {
            $this->refresh();

            $this->update([
                'status' => ImportStatus::Failed,
                'finished_at' => now(),
                'meta' => array_merge($this->meta ?? [], ['failure_reason' => $reason]),
            ]);
        });
    }
}
