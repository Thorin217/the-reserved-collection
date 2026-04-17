<?php

use App\Enums\ImportStatus;
use App\Enums\ImportType;
use App\Jobs\ProcessProductsImport;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Import;
use App\Models\ImportError;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\withoutMiddleware;

beforeEach(function () {
    withoutMiddleware();
});

it('downloads products import template', function () {
    get('/admin/products/import/template')
        ->assertSuccessful()
        ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

it('stores import file and dispatches queued processing', function () {
    Storage::fake('local');
    Queue::fake();

    $user = User::factory()->create();
    actingAs($user);

    post('/admin/products/import', [
        'file' => UploadedFile::fake()->create(
            name: 'products.xlsx',
            kilobytes: 120,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ),
    ])
        ->assertRedirect()
        ->assertSessionHas('success')
        ->assertSessionHas('import_run_id');

    $import = Import::query()->first();

    expect($import)->not->toBeNull()
        ->and($import?->user_id)->toBe($user->id)
        ->and($import?->type)->toBe(ImportType::Products)
        ->and($import?->status)->toBe(ImportStatus::Pending)
        ->and($import?->file_path)->not->toBe('');

    Queue::assertPushedOn('imports', ProcessProductsImport::class);
});

it('returns import status payload with errors list', function () {
    $import = Import::query()->create([
        'type' => ImportType::Products,
        'status' => ImportStatus::CompletedWithErrors,
        'file_path' => 'imports/products/sample.xlsx',
        'processed_rows' => 10,
        'successful_rows' => 8,
        'failed_rows' => 2,
        'meta' => ['original_file_name' => 'sample.xlsx'],
    ]);

    $import->errors()->create([
        'row_number' => 5,
        'attribute' => 'variant_sku',
        'value' => 'ROL-DUP-001',
        'error_code' => 'ROW_PROCESSING_ERROR',
        'message' => 'Variant SKU already exists for another product.',
    ]);

    get('/admin/products/import/'.$import->id)
        ->assertSuccessful()
        ->assertJsonPath('data.id', $import->id)
        ->assertJsonPath('data.status', ImportStatus::CompletedWithErrors->value)
        ->assertJsonPath('data.failed_rows', 2)
        ->assertJsonPath('data.errors.0.attribute', 'variant_sku');
});

it('resolves brand and category by name using lowercase and accent-insensitive normalization', function () {
    Storage::fake('local');

    $brand = Brand::factory()->create(['name' => 'Fossil']);
    $category = Category::factory()->create(['name' => 'Relojes']);

    $csv = implode("\n", [
        'product_sku,product_name,brand_name,category_name,description,product_type,track_stock,has_serial_numbers,status,variant_sku,variant_cost,variant_price,variant_compare_price,variant_barcode,variant_weight,variant_is_active',
        'FOS-001,Fossil Heritage,fossil,relojes,Import by relation names,variant,1,0,active,FOS-001-VAR-01,100,150,170,1234567890123,0.2,1',
    ]);

    Storage::disk('local')->put('imports/products/name-mapping.csv', $csv);

    $import = Import::query()->create([
        'type' => ImportType::Products,
        'status' => ImportStatus::Pending,
        'file_path' => 'imports/products/name-mapping.csv',
    ]);

    (new ProcessProductsImport($import->id))->handle();

    $product = Product::query()->where('sku', 'FOS-001')->first();
    $variant = ProductVariant::query()->where('sku', 'FOS-001-VAR-01')->first();

    expect($product)->not->toBeNull()
        ->and($product?->brand_id)->toBe($brand->id)
        ->and($product?->category_id)->toBe($category->id)
        ->and($variant)->not->toBeNull()
        ->and($variant?->product_id)->toBe($product?->id);
});

it('stores suggestion message when brand name is not found', function () {
    Storage::fake('local');

    Brand::factory()->create(['name' => 'Fossil']);
    Category::factory()->create(['name' => 'Relojes']);

    $csv = implode("\n", [
        'product_sku,product_name,brand_name,category_name,description,product_type,track_stock,has_serial_numbers,status,variant_sku,variant_cost,variant_price,variant_compare_price,variant_barcode,variant_weight,variant_is_active',
        'FOS-002,Fossil Legacy,fossill,relojes,Brand typo to trigger suggestion,variant,1,0,active,FOS-002-VAR-01,100,150,170,1234567890123,0.2,1',
    ]);

    Storage::disk('local')->put('imports/products/name-suggestion.csv', $csv);

    $import = Import::query()->create([
        'type' => ImportType::Products,
        'status' => ImportStatus::Pending,
        'file_path' => 'imports/products/name-suggestion.csv',
    ]);

    (new ProcessProductsImport($import->id))->handle();

    $error = ImportError::query()->where('import_id', $import->id)->first();

    expect($error)->not->toBeNull()
        ->and($error?->message)->toContain('Did you mean: fossil?');
});

it('ignores empty-like rows and does not create false validation errors', function () {
    Storage::fake('local');

    Brand::factory()->create(['name' => 'Fossil']);
    Category::factory()->create(['name' => 'Relojes']);

    $csv = implode("\n", [
        'product_sku,product_name,brand_name,category_name,description,product_type,track_stock,has_serial_numbers,status,variant_sku,variant_cost,variant_price,variant_compare_price,variant_barcode,variant_weight,variant_is_active',
        'FOS-003,Fossil Bronze,fossil,relojes,Valid row,variant,1,0,active,FOS-003-VAR-01,100,150,170,1234567890123,0.2,1',
        ',,,,,,,,,,,,,,,',
        ',,,,,,,,,,,,,,,',
    ]);

    Storage::disk('local')->put('imports/products/skip-empty-rows.csv', $csv);

    $import = Import::query()->create([
        'type' => ImportType::Products,
        'status' => ImportStatus::Pending,
        'file_path' => 'imports/products/skip-empty-rows.csv',
    ]);

    (new ProcessProductsImport($import->id))->handle();

    $import->refresh();

    expect($import->processed_rows)->toBe(1)
        ->and($import->successful_rows)->toBe(1)
        ->and($import->failed_rows)->toBe(0)
        ->and(ImportError::query()->where('import_id', $import->id)->count())->toBe(0);
});

it('imports one product with multiple variants using the same product sku', function () {
    Storage::fake('local');

    Brand::factory()->create(['name' => 'Fossil']);
    Category::factory()->create(['name' => 'Relojes']);

    $csv = implode("\n", [
        'product_sku,product_name,brand_name,category_name,description,product_type,track_stock,has_serial_numbers,status,variant_sku,variant_cost,variant_price,variant_compare_price,variant_barcode,variant_weight,variant_is_active',
        'FOS-004,Fossil Duo,fossil,relojes,Same product with two variants,variant,1,0,active,FOS-004-VAR-01,100,150,170,1234567890123,0.2,1',
        'FOS-004,Fossil Duo,fossil,relojes,Same product with two variants,variant,1,0,active,FOS-004-VAR-02,110,160,180,1234567890124,0.21,1',
    ]);

    Storage::disk('local')->put('imports/products/multi-variants.csv', $csv);

    $import = Import::query()->create([
        'type' => ImportType::Products,
        'status' => ImportStatus::Pending,
        'file_path' => 'imports/products/multi-variants.csv',
    ]);

    (new ProcessProductsImport($import->id))->handle();

    $product = Product::query()->where('sku', 'FOS-004')->first();

    expect($product)->not->toBeNull()
        ->and(Product::query()->where('sku', 'FOS-004')->count())->toBe(1)
        ->and(ProductVariant::query()->where('product_id', $product?->id)->count())->toBe(2)
        ->and(ProductVariant::query()->where('sku', 'FOS-004-VAR-01')->exists())->toBeTrue()
        ->and(ProductVariant::query()->where('sku', 'FOS-004-VAR-02')->exists())->toBeTrue();
});

it('fails when a variant sku is reused by a different product', function () {
    Storage::fake('local');

    Brand::factory()->create(['name' => 'Fossil']);
    Category::factory()->create(['name' => 'Relojes']);

    Product::query()->create([
        'category_id' => Category::query()->firstOrFail()->id,
        'brand_id' => Brand::query()->firstOrFail()->id,
        'name' => 'Existing Product',
        'sku' => 'FOS-EXIST-001',
        'slug' => 'existing-product',
        'product_type' => 'variant',
        'track_stock' => true,
        'has_serial_numbers' => false,
        'status' => 'active',
    ]);

    $existingProduct = Product::query()->where('sku', 'FOS-EXIST-001')->firstOrFail();

    ProductVariant::query()->create([
        'product_id' => $existingProduct->id,
        'sku' => 'SHARED-VAR-001',
        'is_active' => true,
    ]);

    $csv = implode("\n", [
        'product_sku,product_name,brand_name,category_name,description,product_type,track_stock,has_serial_numbers,status,variant_sku,variant_cost,variant_price,variant_compare_price,variant_barcode,variant_weight,variant_is_active',
        'FOS-005,Fossil Conflict,fossil,relojes,Reuses existing variant sku,variant,1,0,active,SHARED-VAR-001,100,150,170,1234567890125,0.2,1',
    ]);

    Storage::disk('local')->put('imports/products/variant-conflict.csv', $csv);

    $import = Import::query()->create([
        'type' => ImportType::Products,
        'status' => ImportStatus::Pending,
        'file_path' => 'imports/products/variant-conflict.csv',
    ]);

    (new ProcessProductsImport($import->id))->handle();

    $import->refresh();
    $error = ImportError::query()->where('import_id', $import->id)->first();

    expect($import->failed_rows)->toBe(1)
        ->and($error)->not->toBeNull()
        ->and($error?->message)->toContain('Variant SKU already exists for another product.');
});

it('stores all validation messages for a row instead of summarized text', function () {
    Storage::fake('local');

    $csv = implode("\n", [
        'product_sku,product_name,brand_name,category_name,variant_sku',
        'FOS-VAL-001,,,,',
    ]);

    Storage::disk('local')->put('imports/products/full-validation-messages.csv', $csv);

    $import = Import::query()->create([
        'type' => ImportType::Products,
        'status' => ImportStatus::Pending,
        'file_path' => 'imports/products/full-validation-messages.csv',
    ]);

    (new ProcessProductsImport($import->id))->handle();

    $error = ImportError::query()->where('import_id', $import->id)->first();

    expect($error)->not->toBeNull()
        ->and($error?->message)->toContain('The product name field is required.')
        ->and($error?->message)->toContain('The brand name field is required when brand id is not present.')
        ->and($error?->message)->toContain('The category name field is required when category id is not present.')
        ->and($error?->message)->toContain('The variant sku field is required.')
        ->and($error?->message)->not->toContain('(and');
});
