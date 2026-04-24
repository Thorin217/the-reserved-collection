import { Head } from '@inertiajs/react';
import AuctionRoom from '@/components/portal/auction-room';
import PortalLayout from '@/layouts/portal-layout';
import type { Auction, ProductNegotiation } from '@/types';

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
    negotiations?: {
        data: ProductNegotiation[];
    } | null;
    selected_negotiation?: {
        data: ProductNegotiation;
    } | null;
};

export default function AuctionHousePage({ auctions, selected_auction, filters, negotiations, selected_negotiation }: Props) {
    return (
        <>
            <Head title="Auction House" />
            <AuctionRoom
                auctions={auctions.data}
                selectedAuction={selected_auction?.data ?? null}
                mode={filters.view}
                negotiations={negotiations?.data ?? null}
                selectedNegotiation={selected_negotiation?.data ?? null}
            />
        </>
    );
}

AuctionHousePage.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
