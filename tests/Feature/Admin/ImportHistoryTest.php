<?php

namespace Tests\Feature\Admin;

use App\Enums\ImportStatus;
use App\Enums\ImportType;
use App\Models\Import;
use App\Models\ImportError;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ImportHistoryTest extends TestCase
{
    use RefreshDatabase;

    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create();
        $this->userId = $user->id;

        $this->withoutMiddleware();
        $this->actingAs($user);
    }

    public function test_it_lists_imports_history_in_configuration_module(): void
    {
        Import::query()->create([
            'user_id' => $this->userId,
            'type' => ImportType::Products,
            'status' => ImportStatus::Completed,
            'file_path' => 'imports/products/completed.xlsx',
            'processed_rows' => 10,
            'successful_rows' => 10,
            'failed_rows' => 0,
            'meta' => ['original_file_name' => 'completed.xlsx'],
        ]);

        Import::query()->create([
            'user_id' => $this->userId,
            'type' => ImportType::Products,
            'status' => ImportStatus::CompletedWithErrors,
            'file_path' => 'imports/products/errors.xlsx',
            'processed_rows' => 8,
            'successful_rows' => 6,
            'failed_rows' => 2,
            'meta' => ['original_file_name' => 'errors.xlsx'],
        ]);

        $this->get('/admin/imports')
            ->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/imports/index')
                ->where('imports.data.0.file_name', 'errors.xlsx')
                ->where('statusOptions.4', ImportStatus::Failed->value)
            );
    }

    public function test_it_downloads_uploaded_import_file(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('imports/products/source.xlsx', 'fake excel binary');

        $import = Import::query()->create([
            'user_id' => $this->userId,
            'type' => ImportType::Products,
            'status' => ImportStatus::Failed,
            'file_path' => 'imports/products/source.xlsx',
            'processed_rows' => 0,
            'successful_rows' => 0,
            'failed_rows' => 0,
            'meta' => ['original_file_name' => 'source.xlsx'],
        ]);

        $this->get('/admin/imports/'.$import->id.'/download')
            ->assertSuccessful()
            ->assertDownload('source.xlsx');
    }

    public function test_it_filters_imports_by_status(): void
    {
        Import::query()->create([
            'user_id' => $this->userId,
            'type' => ImportType::Products,
            'status' => ImportStatus::Completed,
            'file_path' => 'imports/products/ok.xlsx',
            'processed_rows' => 3,
            'successful_rows' => 3,
            'failed_rows' => 0,
            'meta' => ['original_file_name' => 'ok.xlsx'],
        ]);

        Import::query()->create([
            'user_id' => $this->userId,
            'type' => ImportType::Products,
            'status' => ImportStatus::Failed,
            'file_path' => 'imports/products/fail.xlsx',
            'processed_rows' => 3,
            'successful_rows' => 1,
            'failed_rows' => 2,
            'meta' => ['original_file_name' => 'fail.xlsx'],
        ]);

        $this->get('/admin/imports?status=failed')
            ->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/imports/index')
                ->where('imports.data.0.status', ImportStatus::Failed->value)
                ->where('imports.data.0.file_name', 'fail.xlsx')
            );
    }

    public function test_it_exports_failed_rows_as_csv(): void
    {
        $import = Import::query()->create([
            'user_id' => $this->userId,
            'type' => ImportType::Products,
            'status' => ImportStatus::CompletedWithErrors,
            'file_path' => 'imports/products/errors.xlsx',
            'processed_rows' => 2,
            'successful_rows' => 1,
            'failed_rows' => 1,
            'meta' => ['original_file_name' => 'errors.xlsx'],
        ]);

        ImportError::query()->create([
            'import_id' => $import->id,
            'row_number' => 4,
            'attribute' => 'brand_name',
            'value' => 'unkn0wn',
            'error_code' => 'RELATION_NOT_FOUND',
            'message' => 'Brand not found.',
        ]);

        $this->get('/admin/imports/'.$import->id.'/errors-export')
            ->assertSuccessful()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8')
            ->assertDownload('import-'.$import->id.'-errors.csv');
    }

    public function test_it_sorts_imports_by_id_ascending(): void
    {
        Import::query()->create([
            'user_id' => $this->userId,
            'type' => ImportType::Products,
            'status' => ImportStatus::Completed,
            'file_path' => 'imports/products/second.xlsx',
            'processed_rows' => 1,
            'successful_rows' => 1,
            'failed_rows' => 0,
            'meta' => ['original_file_name' => 'second.xlsx'],
        ]);

        Import::query()->create([
            'user_id' => $this->userId,
            'type' => ImportType::Products,
            'status' => ImportStatus::Completed,
            'file_path' => 'imports/products/third.xlsx',
            'processed_rows' => 1,
            'successful_rows' => 1,
            'failed_rows' => 0,
            'meta' => ['original_file_name' => 'third.xlsx'],
        ]);

        $this->get('/admin/imports?sort_by=id&sort_direction=asc')
            ->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/imports/index')
                ->where('imports.data.0.file_name', 'second.xlsx')
                ->where('imports.data.1.file_name', 'third.xlsx')
            );
    }
}
