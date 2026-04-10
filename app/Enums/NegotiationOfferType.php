<?php

namespace App\Enums;

enum NegotiationOfferType: string
{
    case OurOffer = 'our_offer';
    case ClientCounteroffer = 'client_counteroffer';
}
