<?php

namespace App\Enums;

enum ProductNegotiationMessageType: string
{
    case Offer = 'offer';
    case CounterOffer = 'counter_offer';
    case Note = 'note';
}
