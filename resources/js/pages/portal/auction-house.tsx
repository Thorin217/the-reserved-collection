import { Head } from '@inertiajs/react';
import AuctionRoom from '@/components/portal/auction-room';
import PortalLayout from '@/layouts/portal-layout';
import type { Auction } from '@/types';

type Props = {
    auctions: {
        data: Auction[];
    };
    selected_auction: {
        data: Auction;
    } | null;
    filters: {
        view?: string;
        auction?: string;
    };
};

export default function AuctionHousePage({ auctions, selected_auction, filters }: Props) {
    return (
        <>
            <Head title="Auction House" />
            <AuctionRoom
                auctions={auctions.data}
                selectedAuction={selected_auction?.data ?? null}
                mode={filters.view}
            />
        </>
    );
}

AuctionHousePage.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
