<?php

namespace App\Enums;

enum AuctionEventFormat: string
{
    case Lot = 'lot';
    case GroupedItems = 'grouped_items';
}
