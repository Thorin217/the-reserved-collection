<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ImportStatus;
use App\Enums\ImportType;
use App\Exports\ProductsImportTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductImportRequest;
use App\Jobs\ProcessProductsImport;
use App\Models\Import;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProductImportController extends Controller
{
    public function template(): BinaryFileResponse
    {
        return Excel::download(
            new ProductsImportTemplateExport,
            'products-import-template.xlsx',
        );
    }

    public function store(StoreProductImportRequest $request): RedirectResponse
    {
        $file = $request->file('file');

        $path = $file->store('imports/products');

        $import = Import::query()->create([
            'user_id' => $request->user()?->id,
            'type' => ImportType::Products,
            'status' => ImportStatus::Pending,
            'file_path' => $path,
            'meta' => [
                'original_file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ],
        ]);

        ProcessProductsImport::dispatch($import->id)->onQueue('imports');

        return back()
            ->with('success', 'Import started successfully. We will notify you by email when processing finishes.')
            ->with('import_run_id', $import->id);
    }

    public function show(int $importRun): JsonResponse
    {
        $import = Import::query()->findOrFail($importRun);

        $importType = $import->type instanceof ImportType
            ? $import->type
            : ImportType::tryFrom((string) $import->type);

        abort_unless($importType === ImportType::Products, 404);

        $import->load(['errors' => fn ($query) => $query->latest()->limit(100)]);

        return response()->json([
            'data' => [
                'id' => $import->id,
                'status' => $import->status?->value,
                'processed_rows' => $import->processed_rows,
                'successful_rows' => $import->successful_rows,
                'failed_rows' => $import->failed_rows,
                'started_at' => $import->started_at,
                'finished_at' => $import->finished_at,
                'meta' => $import->meta,
                'errors' => $import->errors->map(fn ($error) => [
                    'id' => $error->id,
                    'row_number' => $error->row_number,
                    'attribute' => $error->attribute,
                    'value' => $error->value,
                    'error_code' => $error->error_code,
                    'message' => $error->message,
                ]),
            ],
        ]);
    }
}
