<?php

namespace Database\Seeders;

use App\Enums\InventoryMovementType;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PhaseOneInventorySeeder extends Seeder
{
    /**
     * Seed baseline data for phase 1 inventory testing.
     */
    public function run(): void
    {
        DB::transaction(function (): void {
            $branchA = Branch::query()->updateOrCreate(
                ['name' => 'Branch A'],
                [
                    'phone' => '+51 999 111 111',
                    'email' => 'branch-a@reserved.test',
                    'city' => 'Lima',
                    'country' => 'Peru',
                    'is_active' => true,
                ],
            );

            $branchB = Branch::query()->updateOrCreate(
                ['name' => 'Branch B'],
                [
                    'phone' => '+51 999 222 222',
                    'email' => 'branch-b@reserved.test',
                    'city' => 'Cusco',
                    'country' => 'Peru',
                    'is_active' => true,
                ],
            );

            $warehouseA1 = Warehouse::query()->updateOrCreate(
                [
                    'branch_id' => $branchA->id,
                    'name' => 'Warehouse A1',
                ],
                [
                    'type' => 'main',
                    'allows_sales' => true,
                    'description' => 'Origin warehouse for phase 1 inventory testing',
                    'is_active' => true,
                ],
            );

            $warehouseB1 = Warehouse::query()->updateOrCreate(
                [
                    'branch_id' => $branchB->id,
                    'name' => 'Warehouse B1',
                ],
                [
                    'type' => 'main',
                    'allows_sales' => true,
                    'description' => 'Destination warehouse for phase 1 inventory testing',
                    'is_active' => true,
                ],
            );

            $brand = Brand::query()->updateOrCreate(
                ['slug' => 'phase1-seed-brand'],
                [
                    'name' => 'Phase 1 Brand',
                    'description' => 'Brand used by phase 1 test dataset',
                    'is_active' => true,
                ],
            );

            $category = Category::query()->updateOrCreate(
                ['slug' => 'phase1-seed-category'],
                [
                    'parent_id' => null,
                    'name' => 'Phase 1 Category',
                    'description' => 'Category used by phase 1 test dataset',
                    'is_active' => true,
                ],
            );

            $simpleProduct = Product::query()->updateOrCreate(
                ['sku' => 'P1-SIMPLE-001'],
                [
                    'category_id' => $category->id,
                    'brand_id' => $brand->id,
                    'name' => 'Phase 1 Simple Product',
                    'slug' => 'phase-1-simple-product',
                    'description' => 'Simple product for inventory tests',
                    'product_type' => 'simple',
                    'track_stock' => true,
                    'has_serial_numbers' => false,
                    'status' => 'active',
                ],
            );

            $simpleVariant = ProductVariant::query()->updateOrCreate(
                ['sku' => 'P1-SIMPLE-001-STD'],
                [
                    'product_id' => $simpleProduct->id,
                    'cost' => 1200,
                    'price' => 1700,
                    'compare_price' => 1900,
                    'is_active' => true,
                ],
            );

            InventoryStock::query()->updateOrCreate(
                [
                    'warehouse_id' => $warehouseA1->id,
                    'product_variant_id' => $simpleVariant->id,
                ],
                [
                    'quantity' => 20,
                    'reserved_quantity' => 0,
                    'available_quantity' => 20,
                    'average_cost' => 1200,
                ],
            );

            InventoryMovement::query()->updateOrCreate(
                [
                    'movement_type' => InventoryMovementType::Opening,
                    'warehouse_id' => $warehouseA1->id,
                    'product_variant_id' => $simpleVariant->id,
                    'serial_id' => null,
                    'notes' => 'Seed opening stock for P1-SIMPLE-001-STD',
                ],
                [
                    'reference_type' => Product::class,
                    'reference_id' => $simpleProduct->id,
                    'branch_id' => $warehouseA1->branch_id,
                    'quantity' => 20,
                    'unit_cost' => 1200,
                    'balance_after_movement' => 20,
                    'user_id' => null,
                ],
            );

            $serializedProduct = Product::query()->updateOrCreate(
                ['sku' => 'P1-SERIAL-001'],
                [
                    'category_id' => $category->id,
                    'brand_id' => $brand->id,
                    'name' => 'Phase 1 Serialized Product',
                    'slug' => 'phase-1-serialized-product',
                    'description' => 'Serialized product for inventory tests',
                    'product_type' => 'serializable',
                    'track_stock' => true,
                    'has_serial_numbers' => true,
                    'status' => 'active',
                ],
            );

            $serializedVariant = ProductVariant::query()->updateOrCreate(
                ['sku' => 'P1-SERIAL-001-STD'],
                [
                    'product_id' => $serializedProduct->id,
                    'cost' => 3500,
                    'price' => 5400,
                    'compare_price' => 5900,
                    'is_active' => true,
                ],
            );

            $serialNumbers = [
                'P1-SN-0001',
                'P1-SN-0002',
                'P1-SN-0003',
                'P1-SN-0004',
                'P1-SN-0005',
            ];

            foreach ($serialNumbers as $serialNumber) {
                $serial = ProductSerial::query()->updateOrCreate(
                    ['serial_number' => $serialNumber],
                    [
                        'product_variant_id' => $serializedVariant->id,
                        'imei_or_reference' => 'REF-'.$serialNumber,
                        'warehouse_id' => $warehouseA1->id,
                        'status' => 'available',
                    ],
                );

                InventoryMovement::query()->updateOrCreate(
                    [
                        'movement_type' => InventoryMovementType::Opening,
                        'warehouse_id' => $warehouseA1->id,
                        'product_variant_id' => $serializedVariant->id,
                        'serial_id' => $serial->id,
                        'notes' => 'Seed opening stock for serial '.$serial->serial_number,
                    ],
                    [
                        'reference_type' => ProductSerial::class,
                        'reference_id' => $serial->id,
                        'branch_id' => $warehouseA1->branch_id,
                        'quantity' => 1,
                        'unit_cost' => null,
                        'balance_after_movement' => null,
                        'user_id' => null,
                    ],
                );
            }

            $availableSerializedUnits = ProductSerial::query()
                ->where('product_variant_id', $serializedVariant->id)
                ->where('warehouse_id', $warehouseA1->id)
                ->whereIn('status', ['available', 'returned'])
                ->count();

            $reservedSerializedUnits = ProductSerial::query()
                ->where('product_variant_id', $serializedVariant->id)
                ->where('warehouse_id', $warehouseA1->id)
                ->where('status', 'reserved')
                ->count();

            InventoryStock::query()->updateOrCreate(
                [
                    'warehouse_id' => $warehouseA1->id,
                    'product_variant_id' => $serializedVariant->id,
                ],
                [
                    'quantity' => $availableSerializedUnits + $reservedSerializedUnits,
                    'reserved_quantity' => $reservedSerializedUnits,
                    'available_quantity' => $availableSerializedUnits,
                    'average_cost' => 3500,
                ],
            );

            InventoryStock::query()->updateOrCreate(
                [
                    'warehouse_id' => $warehouseB1->id,
                    'product_variant_id' => $serializedVariant->id,
                ],
                [
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                    'available_quantity' => 0,
                    'average_cost' => 3500,
                ],
            );
        });
    }
}
