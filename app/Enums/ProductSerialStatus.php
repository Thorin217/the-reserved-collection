<?php

namespace App\Enums;

enum ProductSerialStatus: string
{
    case Available = 'available';
    case Reserved = 'reserved';
    case Sold = 'sold';
    case Returned = 'returned';
    case Damaged = 'damaged';
    case InTransit = 'in_transit';
}
