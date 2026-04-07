<?php

namespace App\Enums;

enum InventoryMovementType: string
{
    case Opening = 'opening';
    case Purchase = 'purchase';
    case Sale = 'sale';
    case SaleReturn = 'sale_return';
    case PurchaseReturn = 'purchase_return';
    case TransferOut = 'transfer_out';
    case TransferIn = 'transfer_in';
    case AdjustmentIn = 'adjustment_in';
    case AdjustmentOut = 'adjustment_out';
    case Reservation = 'reservation';
    case ReservationRelease = 'reservation_release';
    case Damage = 'damage';
    case Loss = 'loss';
}
