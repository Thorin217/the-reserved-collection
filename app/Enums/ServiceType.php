<?php

namespace App\Enums;

enum ServiceType: string
{
    case FullRestoration = 'full_restoration';
    case AuthenticationAndAppraisal = 'authentication_and_appraisal';
    case PreventiveCare = 'preventive_care';
    case CrystalPolishing = 'crystal_polishing';
    case PressureTesting = 'pressure_testing';
    case CustomSetting = 'custom_setting';

    public function label(): string
    {
        return match ($this) {
            self::FullRestoration => 'Full Restoration',
            self::AuthenticationAndAppraisal => 'Authentication & Appraisal',
            self::PreventiveCare => 'Preventive Care',
            self::CrystalPolishing => 'Crystal Polishing',
            self::PressureTesting => 'Pressure Testing',
            self::CustomSetting => 'Custom Setting',
        };
    }
}
