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
                ['name' => 'Lima · San Isidro'],
                [
                    'phone' => '+51 987 451 200',
                    'email' => 'sanisidro@reserved-collection.pe',
                    'city' => 'Lima',
                    'country' => 'Peru',
                    'is_active' => true,
                ],
            );

            $branchB = Branch::query()->updateOrCreate(
                ['name' => 'Cusco · Centro Histórico'],
                [
                    'phone' => '+51 984 220 510',
                    'email' => 'cusco@reserved-collection.pe',
                    'city' => 'Cusco',
                    'country' => 'Peru',
                    'is_active' => true,
                ],
            );

            $warehouseA1 = Warehouse::query()->updateOrCreate(
                [
                    'branch_id' => $branchA->id,
                    'name' => 'Almacén Principal San Isidro',
                ],
                [
                    'type' => 'main',
                    'allows_sales' => true,
                    'description' => 'Bodega central de ingresos y distribución para Lima',
                    'is_active' => true,
                ],
            );

            $warehouseB1 = Warehouse::query()->updateOrCreate(
                [
                    'branch_id' => $branchB->id,
                    'name' => 'Almacén Boutique Cusco',
                ],
                [
                    'type' => 'main',
                    'allows_sales' => true,
                    'description' => 'Bodega de destino para reposición de tienda Cusco',
                    'is_active' => true,
                ],
            );

            $brand = Brand::query()->updateOrCreate(
                ['slug' => 'maison-vendome'],
                [
                    'name' => 'Maison Vendôme',
                    'description' => 'Casa de lujo con líneas de relojes, joyería y bolsos.',
                    'is_active' => true,
                ],
            );

            $category = Category::query()->updateOrCreate(
                ['slug' => 'relojes-joyeria-bolsos-lujo'],
                [
                    'parent_id' => null,
                    'name' => 'Relojes, Joyería y Bolsos de Lujo',
                    'description' => 'Catálogo premium para boutiques: relojería fina, joyas y marroquinería.',
                    'is_active' => true,
                ],
            );

            $watchCategory = Category::query()->updateOrCreate(
                ['slug' => 'relojes-lujo'],
                [
                    'parent_id' => $category->id,
                    'name' => 'Relojes de Lujo',
                    'description' => 'Piezas de alta relojería con trazabilidad por serial.',
                    'is_active' => true,
                ],
            );

            $jewelryCategory = Category::query()->updateOrCreate(
                ['slug' => 'joyeria-fina'],
                [
                    'parent_id' => $category->id,
                    'name' => 'Joyería Fina',
                    'description' => 'Joyas premium para vitrina y venta por colección.',
                    'is_active' => true,
                ],
            );

            $bagsCategory = Category::query()->updateOrCreate(
                ['slug' => 'bolsos-lujo'],
                [
                    'parent_id' => $category->id,
                    'name' => 'Bolsos de Lujo',
                    'description' => 'Marroquinería de lujo con control por serial.',
                    'is_active' => true,
                ],
            );

            $cartier = Brand::query()->updateOrCreate(
                ['slug' => 'cartier'],
                [
                    'name' => 'Cartier',
                    'description' => 'Alta joyería y relojería francesa.',
                    'is_active' => true,
                ],
            );

            $louisVuitton = Brand::query()->updateOrCreate(
                ['slug' => 'louis-vuitton'],
                [
                    'name' => 'Louis Vuitton',
                    'description' => 'Marroquinería y accesorios de lujo.',
                    'is_active' => true,
                ],
            );

            $simpleProduct = Product::query()->updateOrCreate(
                ['sku' => 'RLX-SVC-001'],
                [
                    'category_id' => $watchCategory->id,
                    'brand_id' => $brand->id,
                    'name' => 'Kit Premium de cuidado para joyería y bolsos',
                    'slug' => 'kit-premium-cuidado-joyeria-bolsos',
                    'description' => 'Kit no serializado para limpieza y mantenimiento de piezas de lujo.',
                    'product_type' => 'simple',
                    'track_stock' => true,
                    'has_serial_numbers' => false,
                    'status' => 'active',
                ],
            );

            $simpleVariant = ProductVariant::query()->updateOrCreate(
                ['sku' => 'RLX-SVC-001-STD'],
                [
                    'product_id' => $simpleProduct->id,
                    'cost' => 450,
                    'price' => 780,
                    'compare_price' => 890,
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
                    'notes' => 'Apertura de stock para servicio técnico premium.',
                ],
                [
                    'reference_type' => Product::class,
                    'reference_id' => $simpleProduct->id,
                    'branch_id' => $warehouseA1->branch_id,
                    'quantity' => 20,
                    'unit_cost' => 450,
                    'balance_after_movement' => 20,
                    'user_id' => null,
                ],
            );

            $serializedProduct = Product::query()->updateOrCreate(
                ['sku' => 'RLX-SUB-126610LN'],
                [
                    'category_id' => $watchCategory->id,
                    'brand_id' => $brand->id,
                    'name' => 'Rolex Submariner Date 41mm',
                    'slug' => 'rolex-submariner-date-41mm',
                    'description' => 'Reloj serializado para trazabilidad por unidad y garantía.',
                    'product_type' => 'serializable',
                    'track_stock' => true,
                    'has_serial_numbers' => true,
                    'status' => 'active',
                ],
            );

            $serializedVariant = ProductVariant::query()->updateOrCreate(
                ['sku' => 'RLX-SUB-126610LN-STD'],
                [
                    'product_id' => $serializedProduct->id,
                    'cost' => 9800,
                    'price' => 12990,
                    'compare_price' => 13990,
                    'is_active' => true,
                ],
            );

            $serialNumbers = [
                'RLX126610-2026-0001',
                'RLX126610-2026-0002',
                'RLX126610-2026-0003',
                'RLX126610-2026-0004',
                'RLX126610-2026-0005',
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
                        'notes' => 'Ingreso inicial de reloj serializado '.$serial->serial_number,
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
                    'average_cost' => 9800,
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
                    'average_cost' => 9800,
                ],
            );

            $jewelryCareProduct = Product::query()->updateOrCreate(
                ['sku' => 'CRT-CARE-001'],
                [
                    'category_id' => $jewelryCategory->id,
                    'brand_id' => $cartier->id,
                    'name' => 'Kit de limpieza para joyería fina',
                    'slug' => 'kit-limpieza-joyeria-fina',
                    'description' => 'Insumo no serializado para mantenimiento de joyas en boutique.',
                    'product_type' => 'simple',
                    'track_stock' => true,
                    'has_serial_numbers' => false,
                    'status' => 'active',
                ],
            );

            $jewelryCareVariant = ProductVariant::query()->updateOrCreate(
                ['sku' => 'CRT-CARE-001-STD'],
                [
                    'product_id' => $jewelryCareProduct->id,
                    'cost' => 85,
                    'price' => 160,
                    'compare_price' => 190,
                    'is_active' => true,
                ],
            );

            InventoryStock::query()->updateOrCreate(
                [
                    'warehouse_id' => $warehouseA1->id,
                    'product_variant_id' => $jewelryCareVariant->id,
                ],
                [
                    'quantity' => 35,
                    'reserved_quantity' => 0,
                    'available_quantity' => 35,
                    'average_cost' => 85,
                ],
            );

            InventoryMovement::query()->updateOrCreate(
                [
                    'movement_type' => InventoryMovementType::Opening,
                    'warehouse_id' => $warehouseA1->id,
                    'product_variant_id' => $jewelryCareVariant->id,
                    'serial_id' => null,
                    'notes' => 'Apertura de stock para kit de limpieza de joyería.',
                ],
                [
                    'reference_type' => Product::class,
                    'reference_id' => $jewelryCareProduct->id,
                    'branch_id' => $warehouseA1->branch_id,
                    'quantity' => 35,
                    'unit_cost' => 85,
                    'balance_after_movement' => 35,
                    'user_id' => null,
                ],
            );

            $bagProduct = Product::query()->updateOrCreate(
                ['sku' => 'LV-CAP-MM-001'],
                [
                    'category_id' => $bagsCategory->id,
                    'brand_id' => $louisVuitton->id,
                    'name' => 'Louis Vuitton Capucines MM Noir',
                    'slug' => 'louis-vuitton-capucines-mm-noir',
                    'description' => 'Bolso serializado para trazabilidad de piezas de vitrina.',
                    'product_type' => 'serializable',
                    'track_stock' => true,
                    'has_serial_numbers' => true,
                    'status' => 'active',
                ],
            );

            $bagVariant = ProductVariant::query()->updateOrCreate(
                ['sku' => 'LV-CAP-MM-001-STD'],
                [
                    'product_id' => $bagProduct->id,
                    'cost' => 6100,
                    'price' => 8450,
                    'compare_price' => 8990,
                    'is_active' => true,
                ],
            );

            $bagSerialNumbers = [
                'LVCAPMM-2026-0001',
                'LVCAPMM-2026-0002',
                'LVCAPMM-2026-0003',
            ];

            foreach ($bagSerialNumbers as $serialNumber) {
                $serial = ProductSerial::query()->updateOrCreate(
                    ['serial_number' => $serialNumber],
                    [
                        'product_variant_id' => $bagVariant->id,
                        'imei_or_reference' => 'REF-'.$serialNumber,
                        'warehouse_id' => $warehouseA1->id,
                        'status' => 'available',
                    ],
                );

                InventoryMovement::query()->updateOrCreate(
                    [
                        'movement_type' => InventoryMovementType::Opening,
                        'warehouse_id' => $warehouseA1->id,
                        'product_variant_id' => $bagVariant->id,
                        'serial_id' => $serial->id,
                        'notes' => 'Ingreso inicial de bolso serializado '.$serial->serial_number,
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

            InventoryStock::query()->updateOrCreate(
                [
                    'warehouse_id' => $warehouseA1->id,
                    'product_variant_id' => $bagVariant->id,
                ],
                [
                    'quantity' => 3,
                    'reserved_quantity' => 0,
                    'available_quantity' => 3,
                    'average_cost' => 6100,
                ],
            );

            InventoryStock::query()->updateOrCreate(
                [
                    'warehouse_id' => $warehouseB1->id,
                    'product_variant_id' => $bagVariant->id,
                ],
                [
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                    'available_quantity' => 0,
                    'average_cost' => 6100,
                ],
            );
        });
    }
}
