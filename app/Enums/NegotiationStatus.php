<?php

namespace App\Enums;

enum NegotiationStatus: string
{
    case Negotiating = 'negotiating';
    case Agreed = 'agreed';
    case Rejected = 'rejected';
}
