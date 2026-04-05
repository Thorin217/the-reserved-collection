<?php

use App\Http\Resources\AttributeOptionResource;
use App\Http\Resources\AttributeResource;
use App\Http\Resources\BranchResource;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\InventoryAdjustmentItemResource;
use App\Http\Resources\InventoryAdjustmentResource;
use App\Http\Resources\InventoryMovementResource;
use App\Http\Resources\InventoryReservationResource;
use App\Http\Resources\InventoryStockResource;
use App\Http\Resources\InventoryTransferItemResource;
use App\Http\Resources\InventoryTransferResource;
use App\Http\Resources\ProductAttributeValueResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductSerialResource;
use App\Http\Resources\ProductVariantResource;
use App\Http\Resources\WarehouseResource;
use App\Models\Attribute as CatalogAttribute;
use App\Models\AttributeOption;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentItem;
use App\Models\InventoryMovement;
use App\Models\InventoryReservation;
use App\Models\InventoryStock;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransferItem;
use App\Models\Product;
use App\Models\ProductAttributeValue;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Tests\TestCase;

uses(TestCase::class);

dataset('model_api_resources', [
    [CatalogAttribute::class, AttributeResource::class, ['id', 'code', 'name', 'entity_level', 'data_type', 'is_filterable']],
    [AttributeOption::class, AttributeOptionResource::class, ['id', 'attribute_id', 'value', 'label', 'sort_order']],
    [Branch::class, BranchResource::class, ['id', 'name', 'phone', 'email', 'is_active']],
    [Brand::class, BrandResource::class, ['id', 'name', 'slug', 'description', 'is_active']],
    [Category::class, CategoryResource::class, ['id', 'parent_id', 'name', 'slug', 'is_active']],
    [InventoryAdjustment::class, InventoryAdjustmentResource::class, ['id', 'code', 'warehouse_id', 'adjustment_type', 'status']],
    [InventoryAdjustmentItem::class, InventoryAdjustmentItemResource::class, ['id', 'adjustment_id', 'product_variant_id', 'quantity', 'unit_cost']],
    [InventoryMovement::class, InventoryMovementResource::class, ['id', 'movement_type', 'reference_type', 'reference_id', 'warehouse_id']],
    [InventoryReservation::class, InventoryReservationResource::class, ['id', 'warehouse_id', 'product_variant_id', 'status', 'expires_at']],
    [InventoryStock::class, InventoryStockResource::class, ['id', 'warehouse_id', 'product_variant_id', 'quantity', 'average_cost']],
    [InventoryTransfer::class, InventoryTransferResource::class, ['id', 'code', 'from_warehouse_id', 'to_warehouse_id', 'status']],
    [InventoryTransferItem::class, InventoryTransferItemResource::class, ['id', 'inventory_transfer_id', 'product_variant_id', 'quantity', 'received_quantity']],
    [Product::class, ProductResource::class, ['id', 'category_id', 'brand_id', 'name', 'sku']],
    [ProductAttributeValue::class, ProductAttributeValueResource::class, ['id', 'attribute_id', 'value_text', 'value_decimal', 'value_boolean']],
    [ProductSerial::class, ProductSerialResource::class, ['id', 'product_variant_id', 'serial_number', 'warehouse_id', 'status']],
    [ProductVariant::class, ProductVariantResource::class, ['id', 'product_id', 'sku', 'price', 'is_active']],
    [Warehouse::class, WarehouseResource::class, ['id', 'branch_id', 'name', 'type', 'is_active']],
]);

it('serializes model api resources with base keys', function (string $modelClass, string $resourceClass, array $expectedKeys) {
    $model = new $modelClass;
    $resource = new $resourceClass($model);

    $payload = $resource->toArray(request());

    expect($payload)->toBeArray();

    foreach ($expectedKeys as $key) {
        expect(array_key_exists($key, $payload))->toBeTrue();
    }
})->with('model_api_resources');
