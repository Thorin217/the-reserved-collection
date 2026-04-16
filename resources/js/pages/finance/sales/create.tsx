import { Head } from '@inertiajs/react';
import SaleForm from '@/components/finance/sale-form';
import { FlashMessage } from '@/components/flash-message';
import AppLayout from '@/layouts/app-layout';
import { index as salesIndex } from '@/routes/admin/finance/sales';
import type { Client, Product, Warehouse } from '@/types';

type Props = {
    clients: { data: Client[] };
    warehouses: { data: Warehouse[] };
    products: { data: Product[] };
};

export default function SalesCreate({ clients, warehouses, products }: Props) {
    return (
        <>
            <Head title="New sale" />
            <FlashMessage />
            <SaleForm
                title="New sale"
                description="Create a draft sale and add line items before confirmation."
                submitLabel="Create sale"
                cancelHref={salesIndex().url}
                submitUrl="/admin/finance/sales"
                method="post"
                clients={clients.data}
                warehouses={warehouses.data}
                products={products.data}
            />
        </>
    );
}

SalesCreate.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Sales', href: salesIndex() },
            { title: 'New', href: '/admin/finance/sales/create' },
        ]}
    >
        {page}
    </AppLayout>
);
