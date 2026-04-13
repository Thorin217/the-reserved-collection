<?php

use App\Models\Attribute;
use App\Models\AttributeOption;
use App\Models\Brand;
use App\Models\Category;
use App\Models\PriceUpdate;
use App\Models\PriceUpdateItem;
use App\Models\Product;
use App\Models\ProductAttributeValue;
use App\Models\ProductVariant;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\withoutMiddleware;

beforeEach(function () {
    withoutMiddleware();
});

it('shows product price updates page', function () {
    get('/admin/products/price-updates')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/products/price-updates/index')
        );
});

it('includes recent fluctuation audit summary in update products page', function () {
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
    ]);

    $priceUpdate = PriceUpdate::query()->create([
        'name' => 'Audit Update',
        'change_type' => 'percentage',
        'change_value' => 4.5,
        'affected_variants_count' => 1,
    ]);

    PriceUpdateItem::query()->create([
        'price_update_id' => $priceUpdate->id,
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'old_price' => 100,
        'new_price' => 104.5,
        'delta_price' => 4.5,
    ]);

    get('/admin/products/price-updates')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/products/price-updates/index')
            ->where('recentFluctuations.0.id', $priceUpdate->id)
            ->where('recentFluctuations.0.affected_products_count', 1)
        );
});

it('previews variants using attribute filter with optional option', function () {
    $brand = Brand::factory()->create();
    $category = Category::factory()->create();

    $metalAttribute = Attribute::query()->create([
        'code' => 'metal',
        'name' => 'Metal',
        'entity_level' => 'product',
        'data_type' => 'select',
        'is_required' => true,
        'is_active' => true,
    ]);

    $goldOption = AttributeOption::query()->create([
        'attribute_id' => $metalAttribute->id,
        'value' => 'gold',
        'label' => 'Gold',
    ]);

    $steelOption = AttributeOption::query()->create([
        'attribute_id' => $metalAttribute->id,
        'value' => 'steel',
        'label' => 'Steel',
    ]);

    $goldProduct = Product::factory()->create([
        'brand_id' => $brand->id,
        'category_id' => $category->id,
    ]);

    $steelProduct = Product::factory()->create([
        'brand_id' => $brand->id,
        'category_id' => $category->id,
    ]);

    $goldVariant = ProductVariant::factory()->create([
        'product_id' => $goldProduct->id,
        'is_active' => true,
    ]);

    ProductVariant::factory()->create([
        'product_id' => $steelProduct->id,
        'is_active' => true,
    ]);

    ProductAttributeValue::query()->create([
        'product_id' => $goldProduct->id,
        'attribute_id' => $metalAttribute->id,
        'attribute_option_id' => $goldOption->id,
    ]);

    ProductAttributeValue::query()->create([
        'product_id' => $steelProduct->id,
        'attribute_id' => $metalAttribute->id,
        'attribute_option_id' => $steelOption->id,
    ]);

    post('/admin/products/price-updates/preview', [
        'filters' => [
            ['attribute_id' => $metalAttribute->id],
        ],
    ])
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/products/price-updates/index')
            ->where('preview.total_variants', 2)
        );

    post('/admin/products/price-updates/preview', [
        'filters' => [
            [
                'attribute_id' => $metalAttribute->id,
                'attribute_option_id' => $goldOption->id,
            ],
        ],
    ])
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/products/price-updates/index')
            ->where('preview.total_variants', 1)
            ->where('preview.variants.0.id', $goldVariant->id)
        );
});

it('applies percentage update to selected variants and stores history', function () {
    $brand = Brand::factory()->create();
    $category = Category::factory()->create();

    $metalAttribute = Attribute::query()->create([
        'code' => 'metal_2',
        'name' => 'Metal 2',
        'entity_level' => 'product',
        'data_type' => 'select',
        'is_required' => true,
        'is_active' => true,
    ]);

    $goldOption = AttributeOption::query()->create([
        'attribute_id' => $metalAttribute->id,
        'value' => 'gold_2',
        'label' => 'Gold 2',
    ]);

    $product = Product::factory()->create([
        'brand_id' => $brand->id,
        'category_id' => $category->id,
    ]);

    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'price' => 100,
        'is_active' => true,
    ]);

    ProductAttributeValue::query()->create([
        'product_id' => $product->id,
        'attribute_id' => $metalAttribute->id,
        'attribute_option_id' => $goldOption->id,
    ]);

    post('/admin/products/price-updates', [
        'name' => 'Increase Gold',
        'change_type' => 'percentage',
        'change_value' => 10,
        'filters' => [
            [
                'attribute_id' => $metalAttribute->id,
                'attribute_option_id' => $goldOption->id,
            ],
        ],
        'variant_ids' => [$variant->id],
    ])
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/products/price-updates/index')
            ->where('execution.applied', true)
            ->where('execution.affected_variants_count', 1)
        );

    expect((float) ProductVariant::query()->findOrFail($variant->id)->price)->toBe(110.0);

    $priceUpdate = PriceUpdate::query()->latest('id')->firstOrFail();

    expect($priceUpdate->change_type)->toBe('percentage')
        ->and((float) $priceUpdate->change_value)->toBe(10.0)
        ->and($priceUpdate->affected_variants_count)->toBe(1);

    $item = PriceUpdateItem::query()->where('price_update_id', $priceUpdate->id)->firstOrFail();

    expect((float) $item->old_price)->toBe(100.0)
        ->and((float) $item->new_price)->toBe(110.0)
        ->and((float) $item->delta_price)->toBe(10.0);
});

it('shows price updates history page', function () {
    $priceUpdate = PriceUpdate::query()->create([
        'name' => 'History Record',
        'change_type' => 'percentage',
        'change_value' => 5,
        'affected_variants_count' => 2,
    ]);

    PriceUpdateItem::query()->create([
        'price_update_id' => $priceUpdate->id,
        'product_id' => Product::factory()->create()->id,
        'product_variant_id' => ProductVariant::factory()->create()->id,
        'old_price' => 100,
        'new_price' => 105,
        'delta_price' => 5,
    ]);

    get('/admin/products/price-updates/history')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/products/price-updates/history/index')
            ->where('history.data.0.id', $priceUpdate->id)
        );
});

it('shows a price update detail page', function () {
    $attribute = Attribute::query()->create([
        'code' => 'material_3',
        'name' => 'Material 3',
        'entity_level' => 'product',
        'data_type' => 'select',
        'is_required' => true,
        'is_active' => true,
    ]);

    $option = AttributeOption::query()->create([
        'attribute_id' => $attribute->id,
        'value' => 'gold_3',
        'label' => 'Gold 3',
    ]);

    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'price' => 100,
    ]);

    $priceUpdate = PriceUpdate::query()->create([
        'name' => 'Detail Record',
        'change_type' => 'percentage',
        'change_value' => 8,
        'affected_variants_count' => 1,
    ]);

    $priceUpdate->filters()->create([
        'entity_level' => 'product',
        'attribute_id' => $attribute->id,
        'attribute_option_id' => $option->id,
    ]);

    $priceUpdate->items()->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'old_price' => 100,
        'new_price' => 108,
        'delta_price' => 8,
    ]);

    get("/admin/products/price-updates/history/{$priceUpdate->id}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/products/price-updates/history/show')
        );

    expect(
        PriceUpdateItem::query()
            ->where('price_update_id', $priceUpdate->id)
            ->where('product_variant_id', $variant->id)
            ->exists()
    )->toBeTrue();
});

it('rejects zero percentage changes', function () {
    $attribute = Attribute::query()->create([
        'code' => 'material_4',
        'name' => 'Material 4',
        'entity_level' => 'product',
        'data_type' => 'select',
        'is_required' => true,
        'is_active' => true,
    ]);

    $option = AttributeOption::query()->create([
        'attribute_id' => $attribute->id,
        'value' => 'gold_4',
        'label' => 'Gold 4',
    ]);

    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'price' => 100,
    ]);
    $oldPrice = (float) $variant->price;

    ProductAttributeValue::query()->create([
        'product_id' => $product->id,
        'attribute_id' => $attribute->id,
        'attribute_option_id' => $option->id,
    ]);

    post('/admin/products/price-updates', [
        'change_type' => 'percentage',
        'change_value' => 0,
        'filters' => [
            [
                'attribute_id' => $attribute->id,
                'attribute_option_id' => $option->id,
            ],
        ],
        'variant_ids' => [$variant->id],
    ])->assertStatus(302);

    expect(PriceUpdate::query()->count())->toBe(0)
        ->and((float) ProductVariant::query()->findOrFail($variant->id)->price)->toBe($oldPrice);
});

it('rejects variants that do not match current filters', function () {
    $attribute = Attribute::query()->create([
        'code' => 'material_5',
        'name' => 'Material 5',
        'entity_level' => 'product',
        'data_type' => 'select',
        'is_required' => true,
        'is_active' => true,
    ]);

    $goldOption = AttributeOption::query()->create([
        'attribute_id' => $attribute->id,
        'value' => 'gold_5',
        'label' => 'Gold 5',
    ]);

    $steelOption = AttributeOption::query()->create([
        'attribute_id' => $attribute->id,
        'value' => 'steel_5',
        'label' => 'Steel 5',
    ]);

    $goldProduct = Product::factory()->create();
    $steelProduct = Product::factory()->create();

    $goldVariant = ProductVariant::factory()->create([
        'product_id' => $goldProduct->id,
        'price' => 100,
    ]);

    ProductVariant::factory()->create([
        'product_id' => $steelProduct->id,
        'price' => 200,
    ]);

    ProductAttributeValue::query()->create([
        'product_id' => $goldProduct->id,
        'attribute_id' => $attribute->id,
        'attribute_option_id' => $goldOption->id,
    ]);

    ProductAttributeValue::query()->create([
        'product_id' => $steelProduct->id,
        'attribute_id' => $attribute->id,
        'attribute_option_id' => $steelOption->id,
    ]);

    post('/admin/products/price-updates', [
        'change_type' => 'percentage',
        'change_value' => 5,
        'filters' => [
            [
                'attribute_id' => $attribute->id,
                'attribute_option_id' => $steelOption->id,
            ],
        ],
        'variant_ids' => [$goldVariant->id],
    ])->assertStatus(302);

    expect(PriceUpdate::query()->count())->toBe(0)
        ->and((float) ProductVariant::query()->findOrFail($goldVariant->id)->price)->toBe(100.0);
});
