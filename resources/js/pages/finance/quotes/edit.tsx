import { Head, Link, router } from '@inertiajs/react';
import { Eye, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import * as QuoteController from '@/actions/App/Http/Controllers/Admin/QuoteController';
import QuoteForm from '@/components/finance/quote-form';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as quotesIndex } from '@/routes/admin/finance/quotes';
import { show as saleShow } from '@/routes/admin/finance/sales';
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
    const [convertOpen, setConvertOpen] = useState(false);

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
                    <div className="flex items-center gap-2">
                        {quote.linked_sale_id ? (
                            <Button
                                asChild
                                type="button"
                                variant="secondary"
                            >
                                <Link href={saleShow(quote.linked_sale_id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View sale
                                </Link>
                            </Button>
                        ) : quote.can?.convert_to_sale ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setConvertOpen(true)}
                            >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Convert to sale
                            </Button>
                        ) : null}

                        {can.delete && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setDeleteOpen(true)}
                            >
                                Delete quote
                            </Button>
                        )}
                    </div>
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

            <ConfirmationModal
                open={convertOpen}
                onOpenChange={setConvertOpen}
                title="Convert quote to sale"
                description={`You are about to convert ${quote.quote_number} into a sale draft.`}
                confirmLabel="Convert to sale"
                onConfirm={() => {
                    router.post(QuoteController.convertToSale.url(quote));
                    setConvertOpen(false);
                }}
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
