import { Head } from '@inertiajs/react';
import AuctionEventForm from '@/components/auction-event-form';
import AppLayout from '@/layouts/app-layout';
import {
    create as auctionEventsCreate,
    index as auctionEventsIndex,
    store as auctionEventsStore,
} from '@/routes/admin/auction-events';

type UnitOption = {
    id: number;
    product_variant_id?: number;
    label: string;
    price: string | null;
    product_name: string | null;
    brand_name: string | null;
    attribute_summary?: string | null;
    image_url?: string | null;
};

type Props = {
    variant_units: UnitOption[];
    serial_units: UnitOption[];
};

export default function AuctionEventsCreate({
    variant_units,
    serial_units,
}: Props) {
    return (
        <>
            <Head title="Create auction event" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Create auction event</h1>
                <AuctionEventForm
                    mode="create"
                    submitUrl={auctionEventsStore().url}
                    variant_units={variant_units}
                    serial_units={serial_units}
                />
            </div>
        </>
    );
}

AuctionEventsCreate.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Commercial', href: '#' },
            { title: 'Auction Events', href: auctionEventsIndex().url },
            { title: 'Create', href: auctionEventsCreate().url },
        ]}
    >
        {page}
    </AppLayout>
);
