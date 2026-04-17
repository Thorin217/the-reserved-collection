<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ImportStatus;
use App\Http\Controllers\Controller;
use App\Models\Import;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $importsQuery = Import::query();

        $this->applyFilters($importsQuery, $request);
        $this->applySorting($importsQuery, $request);

        $imports = $importsQuery
            ->with('user:id,name')
            ->withCount('errors')
            ->paginate(15, ['*'], 'imports_page')
            ->withQueryString()
            ->through(fn (Import $import): array => $this->serializeImport($import));

        return Inertia::render('inventory/imports/index', [
            'imports' => $imports,
            'statusOptions' => array_map(fn (ImportStatus $status): string => $status->value, ImportStatus::cases()),
            'filters' => $request->only(['status', 'sort_by', 'sort_direction', 'imports_page']),
        ]);
    }

    public function download(int $importRun): BinaryFileResponse
    {
        $import = Import::query()->findOrFail($importRun);

        abort_unless(Storage::disk('local')->exists($import->file_path), 404);

        $filename = (string) data_get($import->meta, 'original_file_name', basename($import->file_path));

        return response()->download(Storage::disk('local')->path($import->file_path), $filename);
    }

    public function exportErrors(int $importRun): StreamedResponse
    {
        $import = Import::query()->findOrFail($importRun);

        $filename = sprintf('import-%d-errors.csv', $import->id);

        return response()->streamDownload(function () use ($import): void {
            $handle = fopen('php://output', 'w');

            if (! $handle) {
                return;
            }

            fputcsv($handle, ['row_number', 'attribute', 'value', 'error_code', 'message']);

            $import->errors()
                ->orderBy('id')
                ->chunkById(500, function ($errors) use ($handle): void {
                    foreach ($errors as $error) {
                        fputcsv($handle, [
                            $error->row_number,
                            $error->attribute,
                            $error->value,
                            $error->error_code,
                            $error->message,
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        $status = $request->string('status')->toString();

        if ($status !== '') {
            $query->where('status', $status);
        }
    }

    private function applySorting(Builder $query, Request $request): void
    {
        $sortBy = $request->string('sort_by')->toString();
        $sortDirection = strtolower($request->string('sort_direction')->toString());

        $allowedSortColumns = ['id', 'created_at'];
        $resolvedSortBy = in_array($sortBy, $allowedSortColumns, true) ? $sortBy : 'id';
        $resolvedSortDirection = in_array($sortDirection, ['asc', 'desc'], true) ? $sortDirection : 'desc';

        $query->orderBy($resolvedSortBy, $resolvedSortDirection);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeImport(Import $import): array
    {
        return [
            'id' => $import->id,
            'type' => $import->type?->value,
            'status' => $import->status?->value,
            'total_rows' => $import->total_rows,
            'processed_rows' => $import->processed_rows,
            'successful_rows' => $import->successful_rows,
            'failed_rows' => $import->failed_rows,
            'errors_count' => $import->errors_count,
            'file_path' => $import->file_path,
            'file_name' => (string) data_get($import->meta, 'original_file_name', basename($import->file_path)),
            'user' => $import->user ? [
                'id' => $import->user->id,
                'name' => $import->user->name,
            ] : null,
            'created_at' => $import->created_at?->toDateTimeString(),
            'started_at' => $import->started_at?->toDateTimeString(),
            'finished_at' => $import->finished_at?->toDateTimeString(),
        ];
    }
}
