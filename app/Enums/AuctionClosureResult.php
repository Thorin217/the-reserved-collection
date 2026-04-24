<?php

namespace App\Enums;

enum AuctionClosureResult: string
{
    case Sold = 'sold';
    case ReserveNotMet = 'reserve_not_met';
    case Unsold = 'unsold';
}
