<?php

namespace App\Enums;

enum InventoryAdjustmentStatus: string
{
    case Draft = 'draft';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
}
