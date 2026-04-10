<?php

namespace App\Enums;

enum LeadSource: string
{
    case Whatsapp = 'whatsapp';
    case Web = 'web';
    case Referral = 'referral';
    case Social = 'social';
    case WalkIn = 'walk_in';
    case Other = 'other';
}
