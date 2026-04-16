import { Head } from '@inertiajs/react';
import SaleForm from '@/components/finance/sale-form';
import { FlashMessage } from '@/components/flash-message';
import AppLayout from '@/layouts/app-layout';
import { index as salesIndex } from '@/routes/admin/finance/sales';
import type { Client, Product, Warehouse } from '@/types';

type SaleData = {
    id: number;
    status: 'draft' | 'confirmed' | 'cancelled';
    client_id: number;
    warehouse_id: number | null;
    sold_at: string | null;
    tax_total: string;
    discount_total: string;
    balance_due: string;
    notes: string | null;
    items?: Array<{
        id: number;
        product_variant_id: number | null;
        description: string;
        quantity: string;
        unit_price: string;
        product_variant?: {
            sku?: string | null;
            attribute_summary?: string | null;
            product?: { name?: string | null } | null;
        } | null;
    }>;
};

type Props = {
    sale: { data: SaleData };
    clients: { data: Client[] };
    warehouses: { data: Warehouse[] };
    products: { data: Product[] };
};

export default function SalesEdit({ sale: { data: sale }, clients, warehouses, products }: Props) {
    return (
        <>
            <Head title={`Edit ${sale.id}`} />
            <FlashMessage />
            <SaleForm
                title={`Edit sale #${sale.id}`}
                description="Adjust sale details and item lines before final confirmation."
                submitLabel="Save changes"
                cancelHref={salesIndex().url}
                submitUrl={`/admin/finance/sales/${sale.id}`}
                method="put"
                clients={clients.data}
                warehouses={warehouses.data}
                products={products.data}
                initialSale={sale}
            />
        </>
    );
}

SalesEdit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Sales', href: salesIndex() },
            { title: 'Edit', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
