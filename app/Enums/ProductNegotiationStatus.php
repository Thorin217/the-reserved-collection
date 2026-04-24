<?php

namespace App\Enums;

enum ProductNegotiationStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Agreed = 'agreed';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
}
