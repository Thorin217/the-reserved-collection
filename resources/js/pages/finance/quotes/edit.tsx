import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import * as QuoteController from '@/actions/App/Http/Controllers/Admin/QuoteController';
import QuoteForm from '@/components/finance/quote-form';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as quotesIndex } from '@/routes/admin/finance/quotes';
import type { Client, Lead, Product, Quote } from '@/types';

type Option = {
    value: string;
    label: string;
};

type Props = {
    quote: { data: Quote };
    clients: { data: Client[] };
    leads: { data: Lead[] };
    products: { data: Product[] };
    statuses: Option[];
    currencies: Option[];
    can: {
        delete: boolean;
    };
};

export default function QuotesEdit({
    quote: { data: quote },
    clients,
    leads,
    products,
    statuses,
    currencies,
    can,
}: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    function handleDelete() {
        router.delete(QuoteController.destroy.url(quote));
    }

    return (
        <>
            <Head title={`Edit quote ${quote.quote_number}`} />
            <FlashMessage />
            <QuoteForm
                title={`Edit quote ${quote.quote_number}`}
                description="Update items, totals, dates, and quote status."
                submitLabel="Save changes"
                cancelHref={quotesIndex()}
                submitUrl={QuoteController.update.url(quote)}
                method="put"
                clients={clients.data}
                leads={leads.data}
                products={products.data}
                statuses={statuses}
                currencies={currencies}
                initialQuote={quote}
                headerActions={
                    can.delete ? (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setDeleteOpen(true)}
                        >
                            Delete quote
                        </Button>
                    ) : undefined
                }
            />

            <ConfirmationModal
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete quote"
                description={`You are about to delete ${quote.quote_number}. This will remove the quote and all its lines permanently.`}
                confirmLabel="Delete quote"
                confirmVariant="destructive"
                onConfirm={handleDelete}
            />
        </>
    );
}

QuotesEdit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Quotes', href: quotesIndex() },
            { title: 'Edit', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
