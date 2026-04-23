import { Head } from '@inertiajs/react';
import PurchaseForm from '@/components/finance/purchase-form';
import { FlashMessage } from '@/components/flash-message';
import AppLayout from '@/layouts/app-layout';
import {
    index as purchasesIndex,
    update as updatePurchase,
} from '@/routes/admin/finance/purchases';
import type { Product, Warehouse } from '@/types';

type Vendor = { id: number; name: string };

type PurchaseData = {
    id: number;
    status: 'draft' | 'confirmed' | 'cancelled';
    vendor_id: number | null;
    vendor_name: string;
    warehouse_id: number | null;
    reference: string | null;
    purchased_at: string | null;
    tax_total: string;
    discount_total: string;
    balance_due: string | null;
    notes: string | null;
    items?: Array<{
        id: number;
        product_variant_id: number | null;
        description: string;
        quantity: string;
        unit_cost: string;
        product_variant?: {
            sku?: string | null;
            attribute_summary?: string | null;
            product?: { name?: string | null } | null;
        } | null;
    }>;
};

type Props = {
    purchase: { data: PurchaseData };
    vendors: { data: Vendor[] };
    warehouses: { data: Warehouse[] };
    products: { data: Product[] };
};

export default function PurchasesEdit({ purchase: { data: purchase }, vendors, warehouses, products }: Props) {
    return (
        <>
            <Head title={`Edit ${purchase.id}`} />
            <FlashMessage />
            <PurchaseForm
                title={`Edit purchase #${purchase.id}`}
                description="Adjust purchase details and item lines before final confirmation."
                submitLabel="Save changes"
                cancelHref={purchasesIndex().url}
                submitUrl={updatePurchase.url(purchase.id)}
                method="put"
                vendors={vendors.data}
                warehouses={warehouses.data}
                products={products.data}
                initialPurchase={purchase}
            />
        </>
    );
}

PurchasesEdit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Purchases', href: purchasesIndex() },
            { title: 'Edit', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
