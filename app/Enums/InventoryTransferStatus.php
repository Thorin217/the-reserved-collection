<?php

namespace App\Enums;

enum InventoryTransferStatus: string
{
    case Draft = 'draft';
    case Sent = 'sent';
    case Received = 'received';
    case Cancelled = 'cancelled';
}
