import { Head } from '@inertiajs/react';
import AuctionRoom from '@/components/portal/auction-room';
import PortalLayout from '@/layouts/portal-layout';
import type { Auction } from '@/types';

type Props = {
    auctions: {
        data: Auction[];
    };
    auction: {
        data: Auction;
    };
};

export default function AuctionShowPage({ auctions, auction }: Props) {
    return (
        <>
            <Head title={auction.data.title} />
            <AuctionRoom auctions={auctions.data} selectedAuction={auction.data} useAuctionShowLinks />
        </>
    );
}

AuctionShowPage.layout = (page: React.ReactNode) => <PortalLayout>{page}</PortalLayout>;
