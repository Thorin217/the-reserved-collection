import { Head } from '@inertiajs/react';
import AuctionRoom from '@/components/portal/auction-room';
import PortalLayout from '@/layouts/portal-layout';
import type { AuctionEvent, ProductNegotiation } from '@/types';

type Props = {
    events: {
        data: AuctionEvent[];
    };
    selected_event: {
        data: AuctionEvent;
    } | null;
    selected_auction_slug: string | null;
    filters: {
        view?: string;
        auction?: string;
        event?: string;
    };
    negotiations?: {
        data: ProductNegotiation[];
    } | null;
    selected_negotiation?: {
        data: ProductNegotiation;
    } | null;
};

export default function AuctionHousePage({
    events,
    selected_event,
    selected_auction_slug,
    filters,
    negotiations,
    selected_negotiation,
}: Props) {
    return (
        <>
            <Head title="Auction House" />
            <AuctionRoom
                events={events.data}
                selectedEvent={selected_event?.data ?? null}
                selectedAuctionSlug={selected_auction_slug}
                mode={filters.view}
                negotiations={negotiations?.data ?? null}
                selectedNegotiation={selected_negotiation?.data ?? null}
            />
        </>
    );
}

AuctionHousePage.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
