<?php

namespace App\Enums;

enum ProductType: string
{
    case Simple = 'simple';
    case Variant = 'variant';
    case Serializable = 'serializable';
}
