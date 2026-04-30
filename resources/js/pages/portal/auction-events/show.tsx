import { Head } from '@inertiajs/react';
import AuctionRoom from '@/components/portal/auction-room';
import PortalLayout from '@/layouts/portal-layout';
import type { AuctionEvent } from '@/types';

type Props = {
    events: {
        data: AuctionEvent[];
    };
    selected_event: {
        data: AuctionEvent;
    };
    selected_auction_slug: string | null;
};

export default function AuctionEventShowPage({
    events,
    selected_event,
    selected_auction_slug,
}: Props) {
    return (
        <>
            <Head title={selected_event.data.title} />
            <AuctionRoom
                events={events.data}
                selectedEvent={selected_event.data}
                selectedAuctionSlug={selected_auction_slug}
                useAuctionShowLinks
            />
        </>
    );
}

AuctionEventShowPage.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
