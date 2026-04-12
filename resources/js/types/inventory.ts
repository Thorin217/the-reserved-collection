export type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    products_count?: number;
    created_at: string;
    updated_at: string;
};

export type Category = {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    products_count?: number;
    parent?: Category;
    created_at: string;
    updated_at: string;
};

export type ProductVariant = {
    id: number;
    product_id: number;
    sku: string;
    barcode: string | null;
    attribute_summary: string | null;
    cost: string | null;
    price: string | null;
    compare_price: string | null;
    weight: string | null;
    is_active: boolean;
    attribute_values?: ProductAttributeValue[];
    serials?: ProductSerial[];
    created_at: string;
    updated_at: string;
};

export type AttributeOption = {
    id: number;
    value: string;
    label: string | null;
};

export type Attribute = {
    id: number;
    name: string;
    code: string;
    data_type: 'text' | 'textarea' | 'number' | 'decimal' | 'boolean' | 'date' | 'select';
    unit: string | null;
    is_required: boolean;
    is_filterable: boolean;
    attribute_options?: AttributeOption[];
};

export type ProductAttributeValue = {
    id: number;
    attribute_id: number;
    attribute_option_id: number | null;
    attribute?: Attribute;
    attribute_option?: AttributeOption;
};

export type Product = {
    id: number;
    category_id: number;
    brand_id: number;
    name: string;
    sku: string;
    slug: string;
    description: string | null;
    product_type: 'simple' | 'variant' | 'serializable';
    track_stock: boolean;
    has_serial_numbers: boolean;
    status: 'draft' | 'active' | 'inactive';
    image_url: string;
    variants_count?: number;
    category?: Category;
    brand?: Brand;
    variants?: ProductVariant[];
    created_at: string;
    updated_at: string;
};

export type ProductSerial = {
    id: number;
    product_variant_id: number;
    serial_number: string;
    imei_or_reference: string | null;
    warehouse_id: number | null;
    status: 'available' | 'reserved' | 'sold' | 'returned' | 'damaged' | 'in_transit';
    product_variant?: ProductVariant;
    warehouse?: Warehouse;
    attribute_values?: ProductAttributeValue[];
    created_at: string;
    updated_at: string;
};

export type Branch = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    is_active: boolean;
    warehouses_count?: number;
    created_at: string;
    updated_at: string;
};

export type Warehouse = {
    id: number;
    branch_id: number;
    name: string;
    type: 'main' | 'display' | 'returns' | 'transit' | 'reserved' | 'damaged';
    allows_sales: boolean;
    description: string | null;
    is_active: boolean;
    branch?: Branch;
    created_at: string;
    updated_at: string;
};

export type InventoryMovement = {
    id: number;
    movement_type: string;
    quantity: string;
    unit_cost: string | null;
    notes: string | null;
    warehouse_id: number | null;
    warehouse?: Warehouse;
    user?: { id: number; name: string };
    created_at: string;
    updated_at: string;
};

export type PaginatedData<T> = {
    data: T[];
    links: { first: string; last: string; prev: string | null; next: string | null };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
};
