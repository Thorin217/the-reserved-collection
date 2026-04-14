import numbro from 'numbro';

type NumericValue = number | string | null | undefined;
type SupportedCurrency = 'USD' | 'GTQ';

type CurrencyOptions = {
    currency?: SupportedCurrency;
    mantissa?: number;
    fallback?: string;
};

const currencySymbols: Record<SupportedCurrency, string> = {
    USD: '$',
    GTQ: '$',
};

const currencyMantissas: Record<SupportedCurrency, number> = {
    USD: 0,
    GTQ: 2,
};

function toNumber(value: NumericValue): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const amount = Number(value);

    return Number.isFinite(amount) ? amount : null;
}

export function formatCurrency(
    value: NumericValue,
    options: CurrencyOptions = {},
): string {
    const currency = options.currency ?? 'USD';
    const mantissa = options.mantissa ?? currencyMantissas[currency];
    const amount = toNumber(value);

    if (amount === null) {
        return (
            options.fallback ??
            numbro(0).formatCurrency({
                thousandSeparated: true,
                mantissa,
                optionalMantissa: false,
                currencySymbol: currencySymbols[currency],
            })
        );
    }

    return numbro(amount).formatCurrency({
        thousandSeparated: true,
        mantissa,
        optionalMantissa: false,
        currencySymbol: currencySymbols[currency],
    });
}

export function formatSignedCurrency(
    value: NumericValue,
    options: CurrencyOptions = {},
): string {
    const amount = toNumber(value);
    const formatted = formatCurrency(value, options);

    if (amount === null || amount === 0) {
        return formatted;
    }

    return amount > 0 ? `+${formatted}` : formatted;
}
