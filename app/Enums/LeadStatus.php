<?php

namespace App\Enums;

enum LeadStatus: string
{
    case New = 'new';
    case Contacted = 'contacted';
    case Negotiating = 'negotiating';
    case Won = 'won';
    case Lost = 'lost';
}
