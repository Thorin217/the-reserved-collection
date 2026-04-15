import { Head } from '@inertiajs/react';
import QuoteForm from '@/components/finance/quote-form';
import { FlashMessage } from '@/components/flash-message';
import AppLayout from '@/layouts/app-layout';
import { store as quoteStore } from '@/actions/App/Http/Controllers/Admin/QuoteController';
import { create as quotesCreate, index as quotesIndex } from '@/routes/admin/finance/quotes';
import type { Client, Lead, Product } from '@/types';

type Option = {
    value: string;
    label: string;
};

type Props = {
    clients: { data: Client[] };
    leads: { data: Lead[] };
    products: { data: Product[] };
    statuses: Option[];
    currencies: Option[];
};

export default function QuotesCreate({
    clients,
    leads,
    products,
    statuses,
    currencies,
}: Props) {
    return (
        <>
            <Head title="New quote" />
            <FlashMessage />
            <QuoteForm
                title="New quote"
                description="Create a commercial quote with pricing, items, and dates."
                submitLabel="Create quote"
                cancelHref={quotesIndex()}
                submitUrl={quoteStore.url()}
                method="post"
                clients={clients.data}
                leads={leads.data}
                products={products.data}
                statuses={statuses}
                currencies={currencies}
            />
        </>
    );
}

QuotesCreate.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Quotes', href: quotesIndex() },
            { title: 'New', href: quotesCreate() },
        ]}
    >
        {page}
    </AppLayout>
);
