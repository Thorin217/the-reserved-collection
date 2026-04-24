<?php

namespace App\Enums;

enum SalePaymentType: string
{
    case Cash = 'cash';
    case Credit = 'credit';
}
