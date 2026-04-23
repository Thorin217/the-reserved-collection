import { Head } from '@inertiajs/react';
import PurchaseForm from '@/components/finance/purchase-form';
import { FlashMessage } from '@/components/flash-message';
import AppLayout from '@/layouts/app-layout';
import { index as purchasesIndex, store as storePurchase } from '@/routes/admin/finance/purchases';
import type { Product, Warehouse } from '@/types';

type Vendor = { id: number; name: string };

type Props = {
    vendors: { data: Vendor[] };
    warehouses: { data: Warehouse[] };
    products: { data: Product[] };
};

export default function PurchasesCreate({ vendors, warehouses, products }: Props) {
    return (
        <>
            <Head title="New purchase" />
            <FlashMessage />
            <PurchaseForm
                title="New purchase"
                description="Create a draft purchase order and add line items before confirmation."
                submitLabel="Create purchase"
                cancelHref={purchasesIndex().url}
                submitUrl={storePurchase.url()}
                method="post"
                vendors={vendors.data}
                warehouses={warehouses.data}
                products={products.data}
            />
        </>
    );
}

PurchasesCreate.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Purchases', href: purchasesIndex() },
            { title: 'New', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
