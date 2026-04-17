<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductsImportTemplateExport implements FromArray, WithHeadings
{
    /**
     * @return array<int, array<int, string|int|float>>
     */
    public function array(): array
    {
        return [
            ['EX-NAME-001', 'Example Product by Name', 'Fossil', '', 'Relojes', '', 'Example using brand_name/category_name resolution.', 'variant', 1, 0, 'active', 'EX-NAME-001-VAR-01', 120, 250, 300, '1111111111111', 0.120, 1],
            ['EX-ID-001', 'Example Product by IDs', '', 1, '', 1, 'Example using brand_id/category_id integer fallback.', 'simple', 1, 0, 'draft', 'EX-ID-001-VAR-01', 80, 190, 220, '2222222222222', 0.100, 1],
        ];
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'product_sku',
            'product_name',
            'brand_name',
            'brand_id',
            'category_name',
            'category_id',
            'description',
            'product_type',
            'track_stock',
            'has_serial_numbers',
            'status',
            'variant_sku',
            'variant_cost',
            'variant_price',
            'variant_compare_price',
            'variant_barcode',
            'variant_weight',
            'variant_is_active',
        ];
    }
}
