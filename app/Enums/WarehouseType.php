<?php

namespace App\Enums;

enum WarehouseType: string
{
    case Main = 'main';
    case Display = 'display';
    case Returns = 'returns';
    case Transit = 'transit';
    case Reserved = 'reserved';
    case Damaged = 'damaged';
}
