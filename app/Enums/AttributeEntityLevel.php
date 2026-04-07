<?php

namespace App\Enums;

enum AttributeEntityLevel: string
{
    case Product = 'product';
    case Variant = 'variant';
    case Serial = 'serial';
}
