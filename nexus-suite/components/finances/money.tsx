'use client';

import {
    convertAmount,
    formatMoney,
    getExchangeRates,
    useDisplayCurrency,
} from '@/lib/currency';
import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────
// Display-currency formatting for finances pages.
// Row amounts keep their own currency; everything renders converted
// to the organization's display currency (Organization Settings →
// localStorage mirror), falling back to the raw amount when live
// rates are unavailable.
// ─────────────────────────────────────────────────────────────

export function useFxRates(): Record<string, number> {
    const [rates, setRates] = useState<Record<string, number>>({});
    useEffect(() => {
        let active = true;
        getExchangeRates().then((r) => {
            if (active) setRates(r);
        });
        return () => {
            active = false;
        };
    }, []);
    return rates;
}

/** Formatter: formatMoney(converted to display currency). */
export function useMoneyFormatter(): (
    amount: number | string | null | undefined,
    currencyCode?: string | null
) => string {
    const display = useDisplayCurrency();
    const rates = useFxRates();
    return (amount, currencyCode) => {
        if (amount === null || amount === undefined || amount === '')
            return '—';
        const n = Number(amount);
        if (!Number.isFinite(n)) return '—';
        const converted = convertAmount(
            n,
            currencyCode ?? 'USD',
            display,
            rates
        );
        return formatMoney(
            converted ?? n,
            converted !== null ? display : currencyCode
        );
    };
}

/** Convert a list of {amount} points from a known source currency. */
export function useConvertedPoints<T extends { amount: number }>(
    points: T[],
    sourceCurrency = 'USD'
): T[] {
    const display = useDisplayCurrency();
    const rates = useFxRates();
    if (display === sourceCurrency) return points;
    return points.map((p) => {
        const c = convertAmount(Number(p.amount), sourceCurrency, display, rates);
        return c === null ? p : { ...p, amount: c };
    });
}

export function Money({
    amount,
    currency,
    className,
}: {
    amount: number | string | null | undefined;
    currency?: string | null;
    className?: string;
}) {
    const fmt = useMoneyFormatter();
    return <span className={className}>{fmt(amount, currency)}</span>;
}
