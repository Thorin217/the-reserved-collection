<?php

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
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Tests\TestCase;

uses(TestCase::class);

it('configures attribute model from migration', function () {
    $model = new CatalogAttribute;

    expect($model->getFillable())->toBe([
        'code',
        'name',
        'entity_level',
        'data_type',
        'unit',
        'is_filterable',
        'is_required',
        'sort_order',
        'is_active',
    ])
        ->and($model->getCasts())->toMatchArray([
            'is_filterable' => 'boolean',
            'is_required' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ])
        ->and($model->attributeOptions())->toBeInstanceOf(HasMany::class)
        ->and($model->attributeOptions()->getRelated())->toBeInstanceOf(AttributeOption::class)
        ->and($model->productAttributeValues())->toBeInstanceOf(HasMany::class)
        ->and($model->productAttributeValues()->getRelated())->toBeInstanceOf(ProductAttributeValue::class);
});

it('configures attribute option model from migration', function () {
    $model = new AttributeOption;

    expect($model->getFillable())->toBe([
        'attribute_id',
        'value',
        'label',
        'sort_order',
    ])
        ->and($model->getCasts())->toMatchArray([
            'attribute_id' => 'integer',
            'sort_order' => 'integer',
        ])
        ->and($model->attribute())->toBeInstanceOf(BelongsTo::class)
        ->and($model->attribute()->getRelated())->toBeInstanceOf(CatalogAttribute::class)
        ->and($model->productAttributeValues())->toBeInstanceOf(HasMany::class)
        ->and($model->productAttributeValues()->getRelated())->toBeInstanceOf(ProductAttributeValue::class);
});

it('configures branch model from migration', function () {
    $model = new Branch;

    expect($model->getFillable())->toBe([
        'name',
        'phone',
        'email',
        'address',
        'city',
        'state',
        'country',
        'is_active',
    ])
        ->and($model->getCasts())->toMatchArray([
            'is_active' => 'boolean',
        ])
        ->and($model->warehouses())->toBeInstanceOf(HasMany::class)
        ->and($model->warehouses()->getRelated())->toBeInstanceOf(Warehouse::class)
        ->and($model->inventoryMovements())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryMovements()->getRelated())->toBeInstanceOf(InventoryMovement::class);
});

it('configures brand model from migration', function () {
    $model = new Brand;

    expect($model->getFillable())->toBe([
        'name',
        'slug',
        'description',
        'is_active',
    ])
        ->and($model->getCasts())->toMatchArray([
            'is_active' => 'boolean',
        ])
        ->and($model->products())->toBeInstanceOf(HasMany::class)
        ->and($model->products()->getRelated())->toBeInstanceOf(Product::class);
});

it('configures category model from migration', function () {
    $model = new Category;

    expect($model->getFillable())->toBe([
        'parent_id',
        'name',
        'slug',
        'description',
        'is_active',
    ])
        ->and($model->getCasts())->toMatchArray([
            'parent_id' => 'integer',
            'is_active' => 'boolean',
        ])
        ->and($model->parent())->toBeInstanceOf(BelongsTo::class)
        ->and($model->parent()->getRelated())->toBeInstanceOf(Category::class)
        ->and($model->children())->toBeInstanceOf(HasMany::class)
        ->and($model->children()->getRelated())->toBeInstanceOf(Category::class)
        ->and($model->products())->toBeInstanceOf(HasMany::class)
        ->and($model->products()->getRelated())->toBeInstanceOf(Product::class);
});

it('configures inventory adjustment model from migration', function () {
    $model = new InventoryAdjustment;

    expect($model->getFillable())->toBe([
        'code',
        'warehouse_id',
        'adjustment_type',
        'reason',
        'status',
        'notes',
        'created_by',
        'confirmed_by',
        'confirmed_at',
    ])
        ->and($model->getCasts())->toMatchArray([
            'warehouse_id' => 'integer',
            'created_by' => 'integer',
            'confirmed_by' => 'integer',
            'confirmed_at' => 'datetime',
        ])
        ->and($model->warehouse())->toBeInstanceOf(BelongsTo::class)
        ->and($model->warehouse()->getRelated())->toBeInstanceOf(Warehouse::class)
        ->and($model->creator())->toBeInstanceOf(BelongsTo::class)
        ->and($model->creator()->getRelated())->toBeInstanceOf(User::class)
        ->and($model->confirmer())->toBeInstanceOf(BelongsTo::class)
        ->and($model->confirmer()->getRelated())->toBeInstanceOf(User::class)
        ->and($model->items())->toBeInstanceOf(HasMany::class)
        ->and($model->items()->getRelated())->toBeInstanceOf(InventoryAdjustmentItem::class);
});

it('configures inventory adjustment item model from migration', function () {
    $model = new InventoryAdjustmentItem;

    expect($model->getFillable())->toBe([
        'adjustment_id',
        'product_variant_id',
        'quantity',
        'unit_cost',
    ])
        ->and($model->getCasts())->toMatchArray([
            'adjustment_id' => 'integer',
            'product_variant_id' => 'integer',
            'quantity' => 'decimal:3',
            'unit_cost' => 'decimal:8',
        ])
        ->and($model->adjustment())->toBeInstanceOf(BelongsTo::class)
        ->and($model->adjustment()->getRelated())->toBeInstanceOf(InventoryAdjustment::class)
        ->and($model->productVariant())->toBeInstanceOf(BelongsTo::class)
        ->and($model->productVariant()->getRelated())->toBeInstanceOf(ProductVariant::class);
});

it('configures inventory movement model from migration', function () {
    $model = new InventoryMovement;

    expect($model->getFillable())->toBe([
        'movement_type',
        'reference_type',
        'reference_id',
        'branch_id',
        'warehouse_id',
        'product_variant_id',
        'serial_id',
        'quantity',
        'unit_cost',
        'balance_after_movement',
        'notes',
        'user_id',
    ])
        ->and($model->getCasts())->toMatchArray([
            'reference_id' => 'integer',
            'branch_id' => 'integer',
            'warehouse_id' => 'integer',
            'product_variant_id' => 'integer',
            'serial_id' => 'integer',
            'quantity' => 'decimal:8',
            'unit_cost' => 'decimal:8',
            'balance_after_movement' => 'decimal:8',
            'user_id' => 'integer',
        ])
        ->and($model->reference())->toBeInstanceOf(MorphTo::class)
        ->and($model->branch())->toBeInstanceOf(BelongsTo::class)
        ->and($model->branch()->getRelated())->toBeInstanceOf(Branch::class)
        ->and($model->warehouse())->toBeInstanceOf(BelongsTo::class)
        ->and($model->warehouse()->getRelated())->toBeInstanceOf(Warehouse::class)
        ->and($model->productVariant())->toBeInstanceOf(BelongsTo::class)
        ->and($model->productVariant()->getRelated())->toBeInstanceOf(ProductVariant::class)
        ->and($model->serial())->toBeInstanceOf(BelongsTo::class)
        ->and($model->serial()->getRelated())->toBeInstanceOf(ProductSerial::class)
        ->and($model->user())->toBeInstanceOf(BelongsTo::class)
        ->and($model->user()->getRelated())->toBeInstanceOf(User::class);
});

it('configures inventory reservation model from migration', function () {
    $model = new InventoryReservation;

    expect($model->getFillable())->toBe([
        'warehouse_id',
        'product_variant_id',
        'reference_type',
        'reference_id',
        'quantity',
        'status',
        'expires_at',
    ])
        ->and($model->getCasts())->toMatchArray([
            'warehouse_id' => 'integer',
            'product_variant_id' => 'integer',
            'reference_id' => 'integer',
            'quantity' => 'decimal:3',
            'expires_at' => 'datetime',
        ])
        ->and($model->warehouse())->toBeInstanceOf(BelongsTo::class)
        ->and($model->warehouse()->getRelated())->toBeInstanceOf(Warehouse::class)
        ->and($model->productVariant())->toBeInstanceOf(BelongsTo::class)
        ->and($model->productVariant()->getRelated())->toBeInstanceOf(ProductVariant::class)
        ->and($model->reference())->toBeInstanceOf(MorphTo::class);
});

it('configures inventory stock model from migration', function () {
    $model = new InventoryStock;

    expect($model->getFillable())->toBe([
        'warehouse_id',
        'product_variant_id',
        'quantity',
        'reserved_quantity',
        'available_quantity',
        'average_cost',
    ])
        ->and($model->getCasts())->toMatchArray([
            'warehouse_id' => 'integer',
            'product_variant_id' => 'integer',
            'quantity' => 'decimal:2',
            'reserved_quantity' => 'decimal:2',
            'available_quantity' => 'decimal:2',
            'average_cost' => 'decimal:2',
        ])
        ->and($model->warehouse())->toBeInstanceOf(BelongsTo::class)
        ->and($model->warehouse()->getRelated())->toBeInstanceOf(Warehouse::class)
        ->and($model->productVariant())->toBeInstanceOf(BelongsTo::class)
        ->and($model->productVariant()->getRelated())->toBeInstanceOf(ProductVariant::class);
});

it('configures inventory transfer model from migration', function () {
    $model = new InventoryTransfer;

    expect($model->getFillable())->toBe([
        'code',
        'from_warehouse_id',
        'to_warehouse_id',
        'status',
        'requested_by',
        'approved_by',
        'received_by',
        'notes',
        'sent_at',
        'received_at',
    ])
        ->and($model->getCasts())->toMatchArray([
            'from_warehouse_id' => 'integer',
            'to_warehouse_id' => 'integer',
            'requested_by' => 'integer',
            'approved_by' => 'integer',
            'received_by' => 'integer',
            'sent_at' => 'datetime',
            'received_at' => 'datetime',
        ])
        ->and($model->fromWarehouse())->toBeInstanceOf(BelongsTo::class)
        ->and($model->fromWarehouse()->getRelated())->toBeInstanceOf(Warehouse::class)
        ->and($model->toWarehouse())->toBeInstanceOf(BelongsTo::class)
        ->and($model->toWarehouse()->getRelated())->toBeInstanceOf(Warehouse::class)
        ->and($model->requester())->toBeInstanceOf(BelongsTo::class)
        ->and($model->requester()->getRelated())->toBeInstanceOf(User::class)
        ->and($model->approver())->toBeInstanceOf(BelongsTo::class)
        ->and($model->approver()->getRelated())->toBeInstanceOf(User::class)
        ->and($model->receiver())->toBeInstanceOf(BelongsTo::class)
        ->and($model->receiver()->getRelated())->toBeInstanceOf(User::class)
        ->and($model->items())->toBeInstanceOf(HasMany::class)
        ->and($model->items()->getRelated())->toBeInstanceOf(InventoryTransferItem::class);
});

it('configures inventory transfer item model from migration', function () {
    $model = new InventoryTransferItem;

    expect($model->getFillable())->toBe([
        'inventory_transfer_id',
        'product_variant_id',
        'quantity',
        'received_quantity',
    ])
        ->and($model->getCasts())->toMatchArray([
            'inventory_transfer_id' => 'integer',
            'product_variant_id' => 'integer',
            'quantity' => 'decimal:3',
            'received_quantity' => 'decimal:3',
        ])
        ->and($model->inventoryTransfer())->toBeInstanceOf(BelongsTo::class)
        ->and($model->inventoryTransfer()->getRelated())->toBeInstanceOf(InventoryTransfer::class)
        ->and($model->productVariant())->toBeInstanceOf(BelongsTo::class)
        ->and($model->productVariant()->getRelated())->toBeInstanceOf(ProductVariant::class);
});

it('configures product model from migration', function () {
    $model = new Product;

    expect($model->getFillable())->toBe([
        'category_id',
        'brand_id',
        'name',
        'sku',
        'slug',
        'description',
        'product_type',
        'track_stock',
        'has_serial_numbers',
        'status',
    ])
        ->and($model->getCasts())->toMatchArray([
            'category_id' => 'integer',
            'brand_id' => 'integer',
            'track_stock' => 'boolean',
            'has_serial_numbers' => 'boolean',
        ])
        ->and($model->category())->toBeInstanceOf(BelongsTo::class)
        ->and($model->category()->getRelated())->toBeInstanceOf(Category::class)
        ->and($model->brand())->toBeInstanceOf(BelongsTo::class)
        ->and($model->brand()->getRelated())->toBeInstanceOf(Brand::class)
        ->and($model->variants())->toBeInstanceOf(HasMany::class)
        ->and($model->variants()->getRelated())->toBeInstanceOf(ProductVariant::class)
        ->and($model->attributeValues())->toBeInstanceOf(HasMany::class)
        ->and($model->attributeValues()->getRelated())->toBeInstanceOf(ProductAttributeValue::class);
});

it('configures product attribute value model from migration', function () {
    $model = new ProductAttributeValue;

    expect($model->getFillable())->toBe([
        'product_id',
        'product_variant_id',
        'product_serial_id',
        'attribute_id',
        'value_text',
        'value_textarea',
        'value_number',
        'value_decimal',
        'value_boolean',
        'value_date',
        'attribute_option_id',
    ])
        ->and($model->getCasts())->toMatchArray([
            'product_id' => 'integer',
            'product_variant_id' => 'integer',
            'product_serial_id' => 'integer',
            'attribute_id' => 'integer',
            'value_number' => 'integer',
            'value_decimal' => 'decimal:8',
            'value_boolean' => 'boolean',
            'value_date' => 'date',
            'attribute_option_id' => 'integer',
        ])
        ->and($model->product())->toBeInstanceOf(BelongsTo::class)
        ->and($model->product()->getRelated())->toBeInstanceOf(Product::class)
        ->and($model->productVariant())->toBeInstanceOf(BelongsTo::class)
        ->and($model->productVariant()->getRelated())->toBeInstanceOf(ProductVariant::class)
        ->and($model->productSerial())->toBeInstanceOf(BelongsTo::class)
        ->and($model->productSerial()->getRelated())->toBeInstanceOf(ProductSerial::class)
        ->and($model->attribute())->toBeInstanceOf(BelongsTo::class)
        ->and($model->attribute()->getRelated())->toBeInstanceOf(CatalogAttribute::class)
        ->and($model->attributeOption())->toBeInstanceOf(BelongsTo::class)
        ->and($model->attributeOption()->getRelated())->toBeInstanceOf(AttributeOption::class);
});

it('configures product serial model from migration', function () {
    $model = new ProductSerial;

    expect($model->getFillable())->toBe([
        'product_variant_id',
        'serial_number',
        'imei_or_reference',
        'warehouse_id',
        'status',
    ])
        ->and($model->getCasts())->toMatchArray([
            'product_variant_id' => 'integer',
            'warehouse_id' => 'integer',
        ])
        ->and($model->productVariant())->toBeInstanceOf(BelongsTo::class)
        ->and($model->productVariant()->getRelated())->toBeInstanceOf(ProductVariant::class)
        ->and($model->warehouse())->toBeInstanceOf(BelongsTo::class)
        ->and($model->warehouse()->getRelated())->toBeInstanceOf(Warehouse::class)
        ->and($model->inventoryMovements())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryMovements()->getRelated())->toBeInstanceOf(InventoryMovement::class)
        ->and($model->attributeValues())->toBeInstanceOf(HasMany::class)
        ->and($model->attributeValues()->getRelated())->toBeInstanceOf(ProductAttributeValue::class);
});

it('configures product variant model from migration', function () {
    $model = new ProductVariant;

    expect($model->getFillable())->toBe([
        'product_id',
        'sku',
        'barcode',
        'attribute_summary',
        'cost',
        'price',
        'compare_price',
        'weight',
        'is_active',
    ])
        ->and($model->getCasts())->toMatchArray([
            'product_id' => 'integer',
            'cost' => 'decimal:8',
            'price' => 'decimal:8',
            'compare_price' => 'decimal:8',
            'weight' => 'decimal:3',
            'is_active' => 'boolean',
        ])
        ->and($model->product())->toBeInstanceOf(BelongsTo::class)
        ->and($model->product()->getRelated())->toBeInstanceOf(Product::class)
        ->and($model->serials())->toBeInstanceOf(HasMany::class)
        ->and($model->serials()->getRelated())->toBeInstanceOf(ProductSerial::class)
        ->and($model->inventoryAdjustmentItems())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryAdjustmentItems()->getRelated())->toBeInstanceOf(InventoryAdjustmentItem::class)
        ->and($model->inventoryMovements())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryMovements()->getRelated())->toBeInstanceOf(InventoryMovement::class)
        ->and($model->inventoryReservations())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryReservations()->getRelated())->toBeInstanceOf(InventoryReservation::class)
        ->and($model->inventoryStocks())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryStocks()->getRelated())->toBeInstanceOf(InventoryStock::class)
        ->and($model->inventoryTransferItems())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryTransferItems()->getRelated())->toBeInstanceOf(InventoryTransferItem::class)
        ->and($model->attributeValues())->toBeInstanceOf(HasMany::class)
        ->and($model->attributeValues()->getRelated())->toBeInstanceOf(ProductAttributeValue::class);
});

it('configures warehouse model from migration', function () {
    $model = new Warehouse;

    expect($model->getFillable())->toBe([
        'branch_id',
        'name',
        'type',
        'allows_sales',
        'description',
        'is_active',
    ])
        ->and($model->getCasts())->toMatchArray([
            'branch_id' => 'integer',
            'allows_sales' => 'boolean',
            'is_active' => 'boolean',
        ])
        ->and($model->branch())->toBeInstanceOf(BelongsTo::class)
        ->and($model->branch()->getRelated())->toBeInstanceOf(Branch::class)
        ->and($model->inventoryAdjustments())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryAdjustments()->getRelated())->toBeInstanceOf(InventoryAdjustment::class)
        ->and($model->inventoryMovements())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryMovements()->getRelated())->toBeInstanceOf(InventoryMovement::class)
        ->and($model->inventoryReservations())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryReservations()->getRelated())->toBeInstanceOf(InventoryReservation::class)
        ->and($model->inventoryStocks())->toBeInstanceOf(HasMany::class)
        ->and($model->inventoryStocks()->getRelated())->toBeInstanceOf(InventoryStock::class)
        ->and($model->productSerials())->toBeInstanceOf(HasMany::class)
        ->and($model->productSerials()->getRelated())->toBeInstanceOf(ProductSerial::class)
        ->and($model->outgoingTransfers())->toBeInstanceOf(HasMany::class)
        ->and($model->outgoingTransfers()->getRelated())->toBeInstanceOf(InventoryTransfer::class)
        ->and($model->incomingTransfers())->toBeInstanceOf(HasMany::class)
        ->and($model->incomingTransfers()->getRelated())->toBeInstanceOf(InventoryTransfer::class);
});
