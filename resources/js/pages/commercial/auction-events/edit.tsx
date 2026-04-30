import { Head } from '@inertiajs/react';
import AuctionEventForm from '@/components/auction-event-form';
import AppLayout from '@/layouts/app-layout';
import {
    index as auctionEventsIndex,
    update as auctionEventUpdate,
} from '@/routes/admin/auction-events';
import type { Auction, AuctionEvent } from '@/types';

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
    event: {
        data: AuctionEvent;
    };
    auction: {
        data: Auction | null;
    } | null;
    variant_units: UnitOption[];
    serial_units: UnitOption[];
};

export default function AuctionEventsEdit({
    event: { data: event },
    auction,
    variant_units,
    serial_units,
}: Props) {
    return (
        <>
            <Head title={`Edit ${event.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Edit auction event</h1>
                <AuctionEventForm
                    mode="edit"
                    submitUrl={auctionEventUpdate({ auctionEvent: event }).url}
                    variant_units={variant_units}
                    serial_units={serial_units}
                    event={event}
                    auction={auction?.data ?? null}
                />
            </div>
        </>
    );
}

AuctionEventsEdit.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Commercial', href: '#' },
            { title: 'Auction Events', href: auctionEventsIndex().url },
            { title: 'Edit', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
