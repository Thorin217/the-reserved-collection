<?php

namespace App\Jobs;

use App\Events\ProductsImportCompleted;
use App\Imports\ProductsImport;
use App\Models\Import;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class ProcessProductsImport implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    /**
     * Create a new job instance.
     */
    public function __construct(public int $importId) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $import = Import::query()->with('user')->find($this->importId);

        if (! $import) {
            return;
        }

        if (! Storage::exists($import->file_path)) {
            $import->markAsFailed('Import file not found.');
            ProductsImportCompleted::dispatch($import->fresh('user'));

            return;
        }

        $import->markAsProcessing();

        try {
            $importImplementation = new ProductsImport($import);

            Excel::import($importImplementation, $import->file_path);

            $import->refresh();
            $import->markAsCompleted();
        } catch (Throwable $throwable) {
            $import->markAsFailed($throwable->getMessage());
        }

        ProductsImportCompleted::dispatch($import->fresh('user'));
    }
}
